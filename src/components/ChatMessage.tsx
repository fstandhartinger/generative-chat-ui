import React from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string | React.ReactNode;
  isLoading?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, isLoading }) => {
  return (
    <div
      className={cn(
        "py-8 px-4 md:px-8",
        role === "assistant" ? "bg-gray-800" : "bg-chatbg"
      )}
    >
      <div className="max-w-3xl mx-auto flex gap-4 md:gap-6">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            role === "assistant" ? "bg-accent text-white" : "bg-purple-500"
          )}
        >
          {role === "assistant" ? "AI" : "U"}
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-4 w-full">
                <Progress value={undefined} className="h-1" />
              </div>
              <p className="text-gray-400 text-sm">AI is thinking...</p>
            </div>
          ) : typeof content === "string" ? (
            <p className="text-gray-200 leading-relaxed">{content}</p>
          ) : (
            content
          )}
        </div>
      </div>
    </div>
  );
};