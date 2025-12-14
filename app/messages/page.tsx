"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserKey } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { DashboardShell } from "@/components/dashboard-shell";

export default function UserMessagesPage() {
  const userKey = useUserKey();
  const { toast } = useToast();
  const sendMessage = useMutation(api.messages.sendMessage);
  const messages = useQuery(api.messages.listUserMessages, { userKey });

  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await sendMessage({
        userKey,
        subject,
        content,
      });
      toast({
        title: "Message sent",
        description: "Your message has been sent to the administrator.",
      });
      setSubject("");
      setContent("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
          <p className="text-muted-foreground">Contact support or administrators.</p>
        </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Compose Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Compose Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Subject (max 100 chars)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value.slice(0, 100))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="Type your message here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px]"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Message History */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Message History
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-4">
            <div className="space-y-4">
              {messages?.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet.
                </div>
              )}
              {messages?.map((msg) => (
                <div
                  key={msg._id}
                  className={`rounded-lg border p-4 ${
                    msg.direction === "outbound" ? "bg-muted/50" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {msg.direction === "outbound" ? (
                        <Badge variant="secondary">Admin Reply</Badge>
                      ) : (
                        <Badge variant="outline">Sent</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(msg.created_at), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                    <Badge
                      className={
                        msg.status === "replied"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                      }
                      variant="secondary"
                    >
                      {msg.status}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{msg.subject}</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </DashboardShell>
  );
}
