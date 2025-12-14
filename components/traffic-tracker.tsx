"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function TrafficTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const logVisit = useMutation(api.traffic.logVisit);

  useEffect(() => {
    // Generate or retrieve Visitor ID
    let visitorId = localStorage.getItem("pp_visitor_id");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("pp_visitor_id", visitorId);
    }

    // Generate or retrieve Session ID
    let sessionId = sessionStorage.getItem("pp_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("pp_session_id", sessionId);
    }

    // Prepare data
    const queryString = searchParams.toString();
    const url = `${pathname}${queryString ? "?" + queryString : ""}`;
    const referrer = document.referrer;
    const userAgent = navigator.userAgent;
    
    // Simple device detection
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    const deviceType = isMobile ? "Mobile" : "Desktop";

    // Log visit
    // Note: We are not capturing IP/Geo here as that requires server-side header inspection.
    logVisit({
      path: url,
      visitor_id: visitorId,
      session_id: sessionId,
      referrer: referrer || undefined,
      user_agent: userAgent,
      device_type: deviceType,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}
