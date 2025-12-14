# Google Drive Backup Strategy & Implementation Plan

## 1. Executive Summary
This document outlines the strategy for implementing a secure, automated backup system for PocketPlan that stores data in Google Drive. The solution ensures data resilience, compliance with security standards, and easy recovery in case of data loss.

## 2. Backup Strategy

### 2.1 Frequency & Schedule
*   **Daily Incremental Backups**: Capture changes made in the last 24 hours. Scheduled at 02:00 AM UTC (low traffic).
*   **Weekly Full Backups**: Complete snapshot of all data. Scheduled every Sunday at 03:00 AM UTC.
*   **On-Demand**: Triggered manually by admins or before major system updates.

### 2.2 Data Scope
*   **Database Tables**: `users`, `wallets`, `goals`, `transactions`, `activities`, `debts`, `debt_payments`, `plans`.
*   **Format**: JSON export for structure and compatibility.
*   **Exclusions**: Temporary session tokens (re-login required on restore).

### 2.3 Retention Policy
*   **Daily Backups**: Keep last 14 days.
*   **Weekly Backups**: Keep last 8 weeks.
*   **Monthly Archives**: Keep last 12 months (optional, for long-term compliance).
*   **Pruning**: Automated script runs post-backup to delete expired files.

## 3. Technical Implementation

### 3.1 Architecture
*   **Backend**: Convex Action (`backup:perform`) triggers the process.
*   **Storage**: Google Drive via Google Drive API v3.
*   **Auth**: OAuth 2.0 Service Account (server-to-server).

### 3.2 Data Flow
1.  **Fetch**: Convex Query (`backup:exportData`) retrieves all table data.
2.  **Process**:
    *   Serialize to JSON.
    *   Compress (Gzip) to reduce size.
    *   Encrypt (AES-256-GCM) with a dedicated backup key.
3.  **Upload**: Stream encrypted blob to Google Drive folder.
4.  **Verify**: Checksum verification (MD5) post-upload.
5.  **Log**: Record status in `backup_logs` table.

### 3.3 Google Drive Integration
*   **Folder Structure**:
    ```
    /PocketPlan_Backups
      /Daily
        backup_YYYY-MM-DD.json.gz.enc
      /Weekly
        backup_YYYY-MM-DD_FULL.json.gz.enc
    ```
*   **Metadata**: Custom properties on Drive files to track version and type.

## 4. Security Measures

### 4.1 Encryption
*   **In-Transit**: HTTPS (TLS 1.2+) enforced by Google API.
*   **At-Rest (Google)**: Google Drive encrypts data by default.
*   **Client-Side Encryption**: We encrypt *before* upload using a secret key stored in Convex Environment Variables (`BACKUP_ENCRYPTION_KEY`). This ensures even if Drive is compromised, data is unreadable.

### 4.2 Access Control
*   **Service Account**: Restricted scope (`https://www.googleapis.com/auth/drive.file`). Can only access files it created.
*   **Convex**: Only "admin" role (future implementation) or internal cron job can trigger backup actions.

## 5. Error Handling & Recovery

### 5.1 Failure Management
*   **Retry Logic**: Exponential backoff (3 attempts) for network timeouts.
*   **Alerting**: Send email/Slack notification to admin on final failure.
*   **Logging**: Detailed logs in Convex Dashboard and internal `system_logs` table.

### 5.2 Restoration Procedure (Disaster Recovery)
1.  **Locate**: Admin selects a backup file from the list.
2.  **Download**: System fetches file from Drive.
3.  **Decrypt & Decompress**: Using the system key.
4.  **Import**: A special `restore:importData` mutation clears existing data (optional/dangerous) or merges data. *Note: Full restore usually implies wiping current state to match backup.*

## 6. Implementation Steps

### Phase 1: Setup
1.  Create Google Cloud Project & Service Account.
2.  Enable Drive API.
3.  Generate credentials JSON and store in Convex Env Vars.

### Phase 2: Core Development
1.  Implement `backup:exportData` (Convex Query).
2.  Implement compression/encryption logic (Node.js `zlib`, `crypto`).
3.  Implement Google Drive uploader service.

### Phase 3: Automation
1.  Configure Convex Cron Jobs (`crons.ts`) for daily/weekly triggers.
2.  Implement retention/pruning logic.

### Phase 4: Testing & Verify
1.  **Unit Tests**: Test encryption/decryption roundtrip.
2.  **Integration Tests**: Mock Drive API to test flow.
3.  **Drill**: Perform a full backup and restore on a staging environment.

## 7. Documentation & Handover
*   **Admin Guide**: How to trigger manual backup and perform restore.
*   **Secrets Management**: Where to rotate keys (`BACKUP_ENCRYPTION_KEY`, `GOOGLE_SERVICE_ACCOUNT`).
