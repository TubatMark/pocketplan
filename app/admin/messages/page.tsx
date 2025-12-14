"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserKey } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, User, MoreVertical, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminMessagesPage() {
  const userKey = useUserKey();
  const { toast } = useToast();
  
  // Queries
  const conversations = useQuery(api.messages.listConversations, { userKey });
  const sendAdminMessage = useMutation(api.messages.sendAdminMessage);

  // State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get current conversation details
  const currentConversation = conversations?.find(c => c.user_id === selectedUserId);
  const messages = useQuery(api.messages.getConversation, 
    selectedUserId ? { userKey, targetUserId: selectedUserId as any } : "skip"
  );

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedUserId]);

  // Filter conversations
  const filteredConversations = conversations?.filter(c => 
    c.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!selectedUserId || !replyContent.trim()) return;

    setIsSending(true);
    try {
      await sendAdminMessage({
        userKey,
        targetUserId: selectedUserId as any,
        content: replyContent,
      });
      setReplyContent("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4">
      {/* Sidebar: Conversation List */}
      <Card className="w-80 flex flex-col h-full border-r">
        <div className="p-4 border-b space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Inbox
          </h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 p-2">
            {filteredConversations?.length === 0 && (
              <div className="text-center text-muted-foreground p-4 text-sm">
                No conversations found.
              </div>
            )}
            {filteredConversations?.map((conv) => (
              <button
                key={conv.user_id}
                onClick={() => setSelectedUserId(conv.user_id)}
                className={cn(
                  "flex items-start gap-3 rounded-lg p-3 text-left text-sm transition-all hover:bg-accent",
                  selectedUserId === conv.user_id ? "bg-accent" : "bg-transparent"
                )}
              >
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback>{conv.user_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1 overflow-hidden w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">{conv.user_name}</span>
                    {conv.unread_count > 0 && (
                      <Badge variant="destructive" className="h-5 px-1.5 rounded-full text-[10px]">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground truncate">
                    {conv.last_message.content}
                  </span>
                  <span className="text-[10px] text-muted-foreground text-right">
                    {format(new Date(conv.last_message.created_at), "MMM d")}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedUserId ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback>{currentConversation?.user_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{currentConversation?.user_name}</h3>
                  <p className="text-xs text-muted-foreground">{currentConversation?.user_email}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20"
            >
              {messages?.map((msg) => {
                const isOutbound = msg.direction === "outbound";
                return (
                  <div
                    key={msg._id}
                    className={cn(
                      "flex w-full",
                      isOutbound ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "flex max-w-[70%] flex-col gap-1 rounded-2xl px-4 py-3 text-sm shadow-sm",
                        isOutbound
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-white border rounded-tl-none"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <span className={cn(
                        "text-[10px] self-end",
                        isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {format(new Date(msg.created_at), "h:mm a")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-background">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex items-end gap-2"
              >
                <Textarea
                  placeholder="Type a message..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button type="submit" size="icon" disabled={isSending || !replyContent.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <div className="p-6 bg-muted rounded-full">
              <MessageSquare className="h-12 w-12 text-gray-400" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg text-foreground">No Conversation Selected</h3>
              <p>Select a user from the list to start messaging.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
