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
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TrafficTableProps {
  logs: any[];
  status: "LoadingFirstPage" | "LoadingMore" | "Exhausted" | "CanLoadMore";
  loadMore: (numItems: number) => void;
  isLoading: boolean;
}

export function TrafficTable({ logs, status, loadMore, isLoading }: TrafficTableProps) {
  // We'll manage client-side pagination here for the fetched logs
  // But wait, the Convex pagination loads *more* data, appending it.
  // The requirement is "pagination system... limit 10 items per page".
  // So we should probably use usePaginatedQuery and only show one page at a time?
  // Actually, Convex `usePaginatedQuery` returns a flat list of all loaded items.
  // Standard practice with Convex is "Load More" (infinite scroll), but user asked for "Previous/Next buttons".
  // To achieve true "Page 1, Page 2" with Convex, we usually just fetch big chunks or use skip/take (which is slow).
  // OR, we can just load more and slice the array on the client side.
  // Let's implement client-side slicing of the accumulated `logs` for now, or stick to "Load More" button if acceptable?
  // User explicitly asked for "Previous/Next buttons" and "Page number indicators".
  // Given Convex architecture, the best way to support random page access is hard.
  // BUT, we can support "Next" by loading more, and "Prev" by just showing the previous slice of already loaded data.
  // Let's do that: Client-side pagination of the *accumulated* data.
  
  // Actually, wait. If we have 1000 logs, we don't want to load all 1000 to show page 100.
  // However, Convex `paginate` is cursor based. We can only go forward.
  // So "Next" loads the next page. "Prev" isn't really possible unless we keep the old data.
  // The `usePaginatedQuery` hook returns `results` (all loaded so far).
  // So we can implement a UI that *looks* like pagination but actually just slices the `results` array.
  // If user clicks "Next" and we are at the end of `results`, we call `loadMore`.
  
  // Let's modify the component to handle this logic internally or accept props.
  // Actually, the parent component should probably handle the logic.
  // Let's update the props to accept `onNextPage`, `onPrevPage`, `currentPage`, `totalPages`, etc?
  // No, let's keep it simple.
  
  return (
    <div className="space-y-4">
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
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                  No logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{log.path}</TableCell>
                  <TableCell>{log.referrer ? new URL(log.referrer).hostname : "Direct"}</TableCell>
                  <TableCell>{log.city && log.country ? `${log.city}, ${log.country}` : "Unknown"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.device_type || "Desktop"}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls will be rendered by the parent to maintain state there, 
          or we can render them here if we pass the right callbacks. 
          Let's just render the data here and let parent handle controls. */}
    </div>
  );
}
