"use node";

import { actionGeneric as action } from "convex/server";
import { v } from "convex/values";
import { google } from "googleapis";
import { Readable } from "stream";
import * as zlib from "zlib";
import * as crypto from "crypto";
import { promisify } from "util";
import { internal } from "./_generated/api";

const gzip = promisify(zlib.gzip);

// --- Encryption Helper ---

function encryptData(data: Buffer, key: string): Buffer {
  const derivedKey = crypto.createHash('sha256').update(key).digest();
  const iv = crypto.randomBytes(16); // Initialization Vector
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
  
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: IV (16 bytes) + AuthTag (16 bytes) + Encrypted Data
  return Buffer.concat([iv, authTag, encrypted]);
}

// --- Backup Action ---

export const perform = action({
  args: { 
    type: v.union(v.literal("daily"), v.literal("weekly"), v.literal("manual")) 
  },
  handler: async (ctx: any, args: { type: "daily" | "weekly" | "manual" }): Promise<{ success: boolean; fileId: string; size: number }> => {
    console.log(`[Backup] Starting ${args.type} backup...`);

    // Check if backup is enabled (for automated runs)
    if (args.type !== "manual") {
      // We need to fetch settings. Since this is an action, we can't query DB directly.
      // But actions can run queries.
      // @ts-ignore - internal types might not be generated yet
      const settings = await ctx.runQuery(internal.backup_data.getSettings, {});
      const isEnabled = args.type === "daily" ? settings.daily : settings.weekly;
      
      if (!isEnabled) {
        console.log(`[Backup] ${args.type} backup is disabled. Skipping.`);
        return { success: true, fileId: "skipped", size: 0 };
      }
    }

    // 1. Check Configuration
    const oauthJson = process.env.GOOGLE_DRIVE_OAUTH;
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!oauthJson || !encryptionKey || !folderId) {
      console.error("[Backup] Missing configuration. Check env vars.");
      throw new Error("Backup configuration missing");
    }

    // 2. Fetch Data (from separate internal query)
    console.log("[Backup] Fetching data...");
    // @ts-ignore - internal types might not be generated yet
    const exportResult = await ctx.runQuery(internal.backup_data.exportData, {});
    const jsonData = JSON.stringify(exportResult);
    
    // 3. Compress
    console.log("[Backup] Compressing...");
    const compressed = await gzip(jsonData);
    
    // 4. Encrypt
    console.log("[Backup] Encrypting...");
    const encrypted = encryptData(compressed, encryptionKey);

    // 5. Upload to Google Drive
    console.log("[Backup] Uploading to Google Drive...");
    
    const { clientId, clientSecret, refreshToken } = JSON.parse(oauthJson);
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: 'v3', auth });

    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${args.type}_${dateStr}.json.gz.enc`;

    const fileMetadata: any = {
      name: filename,
      parents: [folderId],
      properties: {
        type: args.type,
        timestamp: exportResult.timestamp.toString(),
        version: "1.0"
      }
    };

    const media = {
      mimeType: 'application/octet-stream',
      body: Readable.from(encrypted),
    };

    try {
      const response: any = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, size',
      });

      console.log(`[Backup] Success! File ID: ${response.data.id}`);
      return { success: true, fileId: response.data.id, size: parseInt(response.data.size) || 0 };

    } catch (error: any) {
      console.error("[Backup] Upload failed:", error.message);
      throw new Error(`Upload failed: ${error.message}`);
    }
  },
});
