"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "convex/react";
import { useUserKey } from "@/lib/session";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

function SettingsContent() {
  const userKey = useUserKey();
  const me = useQuery("users:me" as any, { userKey } as any);
  const updateProfile = useMutation("users:updateProfile" as any);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (me) {
      setName(me.name);
      setEmail(me.email);
    }
  }, [me]);

  return (
    <DashboardShell>
      <div className="max-w-2xl">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {me ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name || "user"}`} />
                    <AvatarFallback>{name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">Profile Picture</h3>
                    <p className="text-sm text-gray-500">Generated automatically based on your name.</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                  </div>
                </div>

                <Button 
                  onClick={async () => {
                    await updateProfile({ userKey, name, email });
                  }}
                >
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Setting up your account…</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}
