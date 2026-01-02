"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserKey } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Send, MessageSquare, ArrowLeft, MoreVertical, X } from "lucide-react";
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

  const handleBackToList = () => {
    setSelectedUserId(null);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      {/* Sidebar: Conversation List */}
      <Card
        className={cn(
          "flex flex-col h-full border transition-all duration-300 ease-in-out shrink-0",
          // Desktop: collapsed width when chat selected, expanded when not
          selectedUserId ? "md:w-16 md:items-center md:py-4" : "md:w-80",
          // Mobile: full width when no chat, slide out when chat selected
          selectedUserId ? "w-0 opacity-0 overflow-hidden" : "w-full",
          // No border on desktop when collapsed
          selectedUserId && "md:border-r"
        )}
      >
        <div className={cn(
          "p-4 border-b space-y-4",
          selectedUserId && "md:p-0 md:border-0 md:space-y-0"
        )}>
          {!selectedUserId && (
            <>
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
            </>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className={cn(
            "flex flex-col gap-1 p-2",
            selectedUserId && "md:p-2"
          )}>
            {filteredConversations?.length === 0 && !selectedUserId && (
              <div className="text-center text-muted-foreground p-4 text-sm">
                No conversations found.
              </div>
            )}
            {filteredConversations?.map((conv) => {
              const isSelected = selectedUserId === conv.user_id;
              return (
                <button
                  key={conv.user_id}
                  onClick={() => setSelectedUserId(conv.user_id)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg p-3 text-left text-sm transition-all hover:bg-accent relative",
                    isSelected ? "bg-accent" : "bg-transparent",
                    selectedUserId && "md:justify-center md:p-2"
                  )}
                >
                  <Avatar className={cn(
                    "border shrink-0",
                    selectedUserId ? "h-10 w-10" : "h-10 w-10"
                  )}>
                    <AvatarFallback className={cn(
                      isSelected && "bg-blue-600 text-white"
                    )}>
                      {conv.user_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {selectedUserId === null && (
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
                  )}
                  {isSelected && selectedUserId && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Chat Area */}
      <Card className={cn(
        "flex flex-col h-full overflow-hidden min-w-0",
        // Full width behavior
        selectedUserId ? "w-full" : "hidden md:flex flex-1",
        // Border adjustments
        selectedUserId && "md:ml-4"
      )}>
        {selectedUserId ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="md:hidden"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-9 sm:h-10 w-9 sm:w-10 border">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {currentConversation?.user_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{currentConversation?.user_name}</h3>
                  <p className="text-xs text-muted-foreground hidden sm:block truncate">
                    {currentConversation?.user_email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Desktop collapse button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="hidden md:flex"
                  title="Back to inbox"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-muted/20"
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
                        "flex max-w-[85%] sm:max-w-[70%] flex-col gap-1 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm shadow-sm",
                        isOutbound
                          ? "bg-gray-900 text-white rounded-tr-sm"
                          : "bg-white border rounded-tl-sm"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <span className={cn(
                        "text-[10px] self-end",
                        isOutbound ? "text-white/70" : "text-muted-foreground"
                      )}>
                        {format(new Date(msg.created_at), "h:mm a")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-3 sm:p-4 border-t bg-background">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex items-end gap-2"
              >
                <Textarea
                  placeholder="Type a message..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[50px] sm:min-h-[60px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isSending || !replyContent.trim()}
                  className="h-10 w-10 sm:h-auto sm:w-auto shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex-col items-center justify-center text-muted-foreground gap-4 p-4 hidden md:flex">
            <div className="p-6 bg-muted rounded-full">
              <MessageSquare className="h-12 w-12 text-gray-400" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg text-foreground">No Conversation Selected</h3>
              <p className="text-base">Select a user from the list to start messaging.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
