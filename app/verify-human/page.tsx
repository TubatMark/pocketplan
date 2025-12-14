"use client";

import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useAction as useActionHook } from "@/hooks/use-action";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function VerifyHumanPage() {
  const [token, setToken] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const verifyCaptcha = useMutation(api.security.verifyCaptcha);
  const router = useRouter();

  // Test Site Key (Always valid)
  const SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

  const handleVerify = async () => {
    if (!token) return;
    setVerifying(true);
    
    try {
      // In a real app, we'd get the IP from a server action or context
      // For this client-side demo, we rely on the backend to use the request IP 
      // or a stored identifier. Since we can't easily get IP client-side, 
      // we'll use a temporary mock ID or fetch it.
      // Ideally, this verification happens via a Server Action that reads headers().
      
      // Simulating IP fetch or using a cookie-based ID
      // For this specific implementation, we'll assume the middleware passed the IP
      // via a cookie or query param, or we just send a placeholder that matches what middleware saw.
      // Let's grab it from a hypothetical cookie or just use a placeholder for the demo
      // since the middleware logic is the primary enforcement point.
      
      const identifier = "client-ip-placeholder"; // In prod, pass this from server props
      
      const result = await verifyCaptcha({ 
        identifier: "127.0.0.1", // Mocking localhost for local dev
        token 
      });

      if (result.success) {
        // Set a cookie to bypass middleware (client-side for demo, usually server-side)
        document.cookie = "is_human=true; path=/; max-age=3600";
        router.push("/");
      } else {
        alert("Verification failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error verifying CAPTCHA");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>Security Check</CardTitle>
          <CardDescription>
            We detected unusual activity from your network. Please verify you are human to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <ReCAPTCHA
            sitekey={SITE_KEY}
            onChange={(val) => setToken(val)}
          />
          
          <Button 
            className="w-full" 
            disabled={!token || verifying}
            onClick={handleVerify}
          >
            {verifying ? "Verifying..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
