"use client";

import { Bot, X, Send, FileText, Sparkles, Download } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState, useRef, useCallback } from "react";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [activeTab, setActiveTab] = useState("architect");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleStarterClick = useCallback(
    (prompt: string) => {
      setInput(prompt);
      // Auto-send after a tick so the state update batches
      setTimeout(() => {
        const userMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: "user",
          content: prompt,
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
      }, 0);
    },
    []
  );

  const handleTextareaInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
      setInput(el.value);
    },
    []
  );

  return (
    <>
      {/* Mobile backdrop scrim */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 md:bg-black/0"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* AI Sidebar panel — floats right, slides in/out */}
      <aside
        className={cn(
          "fixed top-12 right-0 bottom-0 z-30 flex w-80 flex-col bg-card/95 border-l border-border shadow-lg transition-transform duration-200 ease-in-out md:shadow-none",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center gap-2 px-4 border-b border-border">
          <Bot className="h-4 w-4 text-accent-brand" />
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-foreground truncate">
              AI Workspace
            </span>
            <span className="text-xs text-muted-foreground truncate">
              Collaborate with Ghost AI
            </span>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Close AI sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-1 flex-col overflow-hidden p-3"
        >
          <TabsList className="w-full">
            <TabsTrigger value="architect">AI Architect</TabsTrigger>
            <TabsTrigger value="specs">Specs</TabsTrigger>
          </TabsList>

          {/* AI Architect Tab */}
          <TabsContent
            value="architect"
            className="flex-1 flex flex-col overflow-hidden pt-3"
          >
            <ScrollArea className="flex-1 pr-3" ref={scrollRef}>
              {messages.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <Bot className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Ask Ghost AI to design, architect, or plan your system.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleStarterClick(prompt)}
                        className="inline-flex items-center rounded-full bg-muted px-3 py-1.5 text-xs text-accent-foreground hover:bg-muted/80 transition-colors"
                      >
                        <Sparkles className="h-3 w-3 mr-1.5" />
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Chat messages */
                <div className="space-y-3 pb-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                        msg.role === "user"
                          ? "ml-auto bg-accent-brand/20 border-accent-brand/50 border-2 text-foreground"
                          : "mr-auto bg-card border border-border text-accent-foreground"
                      )}
                    >
                      {msg.content}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input area */}
            <div className="shrink-0 border-t border-border p-3 flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask Ghost AI..."
                className="min-h-[72px] max-h-[160px] resize-none text-sm"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim()}
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors",
                  input.trim()
                    ? "bg-accent-brand text-white hover:bg-accent-brand/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </TabsContent>

          {/* Specs Tab */}
          <TabsContent
            value="specs"
            className="flex-1 overflow-y-auto pt-3 space-y-3"
          >
            <button
              type="button"
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-accent-brand px-3 text-sm font-medium text-white hover:bg-accent-brand/90 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Generate Spec
            </button>

            {/* Demo spec card */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  E-commerce Backend Architecture
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Microservices-based e-commerce system with product catalog, cart,
                checkout, and order management.
              </p>
              <button
                type="button"
                disabled
                className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground bg-muted/50 cursor-not-allowed"
              >
                <Download className="h-3 w-3" />
                Download
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </aside>
    </>
  );
}
