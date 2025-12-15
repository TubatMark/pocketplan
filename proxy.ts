import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory store for rate limiting (Per instance)
// In production (Vercel/Serverless), use Redis (e.g., Upstash)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

export function proxy(request: NextRequest) {
  // 1. Skip static assets and API routes that handle the verification itself
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/static") ||
    request.nextUrl.pathname === "/verify-human" ||
    request.nextUrl.pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Check if user is already verified
  const isHuman = request.cookies.get("is_human");
  if (isHuman?.value === "true") {
    return NextResponse.next();
  }

  // 3. Get IP Address
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  // 4. Rate Limiting Logic
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  // Reset window if needed
  if (now - record.lastReset > WINDOW_MS) {
    record.count = 0;
    record.lastReset = now;
  }

  record.count++;
  rateLimitMap.set(ip, record);

  // 5. Check Thresholds
  if (record.count > MAX_REQUESTS) {
    console.warn(`[Security] Rate limit exceeded for IP: ${ip}`);
    // Redirect to CAPTCHA challenge
    return NextResponse.redirect(new URL("/verify-human", request.url));
  }

  // 6. Suspicious Pattern Detection (Basic)
  // Check for missing User-Agent (often bots)
  const userAgent = request.headers.get("user-agent");
  if (!userAgent || userAgent.length < 10) {
     console.warn(`[Security] Suspicious User-Agent from IP: ${ip}`);
     return NextResponse.redirect(new URL("/verify-human", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
