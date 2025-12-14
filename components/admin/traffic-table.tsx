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

export function TrafficTable({ logs }: { logs: any[] }) {
  return (
    <div className="rounded-md border">
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
          {logs.map((log) => (
            <TableRow key={log._id}>
              <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
              <TableCell className="font-medium">{log.path}</TableCell>
              <TableCell>{log.referrer ? new URL(log.referrer).hostname : "Direct"}</TableCell>
              <TableCell>{log.city && log.country ? `${log.city}, ${log.country}` : "Unknown"}</TableCell>
              <TableCell>
                <Badge variant="outline">{log.device_type || "Desktop"}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
