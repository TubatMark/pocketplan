"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink, Globe, Smartphone, Monitor, Tablet } from "lucide-react";
import { format } from "date-fns";

interface TrafficTableProps {
  logs: any[];
  status: "LoadingFirstPage" | "LoadingMore" | "Exhausted" | "CanLoadMore";
  loadMore: (numItems: number) => void;
  isLoading: boolean;
}

const getDeviceIcon = (deviceType?: string) => {
  const type = deviceType?.toLowerCase() || "";
  if (type.includes("mobile") || type.includes("phone")) return Smartphone;
  if (type.includes("tablet")) return Tablet;
  return Monitor;
};

export function TrafficTable({ logs }: TrafficTableProps) {
  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {logs.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-gray-50 p-8 text-center text-sm text-muted-foreground">
            No logs found.
          </div>
        ) : (
          logs.map((log) => {
            const DeviceIcon = getDeviceIcon(log.device_type);
            const source = log.referrer ? new URL(log.referrer).hostname : "Direct";
            return (
              <div key={log._id} className="rounded-xl border bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <DeviceIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Badge variant="outline" className="text-xs shrink-0">
                      {log.device_type || "Desktop"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(log.timestamp), "MMM d, h:mm a")}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm">
                    <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{log.path}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3 shrink-0" />
                    <span className="truncate">{source}</span>
                    {log.city && log.country && (
                      <>
                        <span>•</span>
                        <span>{log.city}, {log.country}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Device</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(log.timestamp), "MMM d, yyyy 'at' h:mm a")}
                    </TableCell>
                    <TableCell className="font-medium">{log.path}</TableCell>
                    <TableCell>{log.referrer ? new URL(log.referrer).hostname : "Direct"}</TableCell>
                    <TableCell>{log.city && log.country ? `${log.city}, ${log.country}` : "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {(() => {
                          const Icon = getDeviceIcon(log.device_type);
                          return <Icon className="h-3 w-3" />;
                        })()}
                        {log.device_type || "Desktop"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
