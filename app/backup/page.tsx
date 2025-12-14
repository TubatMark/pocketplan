"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAction as useActionHook } from "@/hooks/use-action";
import { useData } from "@/hooks/use-data";
import { Loader2, HardDrive, CheckCircle, AlertTriangle, Cloud } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BackupPage() {
  const { toast } = useToast();
  const [backupStatus, setBackupStatus] = useState<any>(null);
  
  // Track loading state per switch
  const [toggling, setToggling] = useState<{ daily: boolean; weekly: boolean }>({
    daily: false,
    weekly: false
  });

  // Use mutation directly for settings
  const updateSettings = useMutation("backup_data:updateSettings" as any);
  const { data: settings, refresh: refreshSettings } = useData<any>("backup_data:getSettings" as any, {});

  const { mutate: performBackup, isLoading } = useActionHook("backup:perform" as any, {
    onSuccess: (result: any) => {
      setBackupStatus({
        success: true,
        message: `Backup successful! File ID: ${result.fileId}`,
        details: result
      });
      toast({
        title: "Backup Complete",
        description: "Your data has been securely backed up to Google Drive.",
      });
    },
    onError: (error) => {
      setBackupStatus({
        success: false,
        message: error.message
      });
      toast({
        title: "Backup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    type: "action"
  });

  const handleToggle = async (type: "daily" | "weekly", enabled: boolean) => {
    // Optimistic update prevention: Don't allow toggling while already updating
    if (toggling[type]) return;

    setToggling(prev => ({ ...prev, [type]: true }));

    try {
      await updateSettings({ type, enabled });
      await refreshSettings(); // Force refresh the data
      toast({
        title: enabled ? "Schedule Enabled" : "Schedule Disabled",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} backup schedule has been ${enabled ? "activated" : "paused"}.`,
        className: enabled ? "border-green-500 bg-green-50" : "border-gray-200",
      });
    } catch (err) {
      toast({
        title: "Update Failed",
        description: `Could not update ${type} settings. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setToggling(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Backup</h2>
          <p className="text-muted-foreground mt-2">
            Manage your secure Google Drive backups.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Manual Backup Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-indigo-600" />
                Manual Backup
              </CardTitle>
              <CardDescription>
                Trigger an immediate full backup of all system data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
                  <p>Data will be:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Exported from Convex Database</li>
                    <li>Compressed (Gzip)</li>
                    <li>Encrypted (AES-256)</li>
                    <li>Uploaded to secure Google Drive folder</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={() => performBackup({ type: "manual" })} 
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Backing up...
                    </>
                  ) : (
                    <>
                      <HardDrive className="mr-2 h-4 w-4" />
                      Start Backup Now
                    </>
                  )}
                </Button>

                {backupStatus && (
                  <div className={`p-4 rounded-lg border ${backupStatus.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    <div className="flex items-center gap-2 font-medium">
                      {backupStatus.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      {backupStatus.success ? "Success" : "Error"}
                    </div>
                    <p className="text-sm mt-1">{backupStatus.message}</p>
                    {backupStatus.success && (
                      <p className="text-xs mt-2 text-green-600 font-mono">Size: {(backupStatus.details.size / 1024).toFixed(2)} KB</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Automated Schedule</CardTitle>
              <CardDescription>
                Configure automated backup frequency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {!settings ? (
                  // Loading Skeleton
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4 w-full">
                        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                        <div className="space-y-2 w-full max-w-[200px]">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4 w-full">
                        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                        <div className="space-y-2 w-full max-w-[200px]">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <span className="font-bold text-indigo-600">D</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Daily Backup</h4>
                          <p className="text-sm text-muted-foreground">Runs every day at 02:00 UTC</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings?.daily ?? true}
                        onCheckedChange={(checked) => handleToggle("daily", checked)}
                        disabled={toggling.daily}
                        className={toggling.daily ? "opacity-50 cursor-wait" : ""}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <span className="font-bold text-purple-600">W</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Weekly Full Backup</h4>
                          <p className="text-sm text-muted-foreground">Runs every Sunday at 03:00 UTC</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings?.weekly ?? true}
                        onCheckedChange={(checked) => handleToggle("weekly", checked)}
                        disabled={toggling.weekly}
                        className={toggling.weekly ? "opacity-50 cursor-wait" : ""}
                      />
                    </div>
                  </>
                )}

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Encryption Status</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>Client-side AES-256 Enabled</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>Secure Service Account Access</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
