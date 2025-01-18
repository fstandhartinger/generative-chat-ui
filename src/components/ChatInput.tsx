import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const examples = [
    "Wie viel Netto bleibt mir vom Brutto meines Einkommens?",
    "Welche Regionen in Südostasien sind im August hinsichtlich Wetter gut bereisbar?",
    "Ich brauche einen Textgenerator für Musikrezensionen",
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-chatbg border-t border-gray-700 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-4">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => {
                setMessage(example);
              }}
              className="px-4 py-2 bg-gray-800 text-gray-200 rounded-full text-sm hover:bg-gray-700 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Sende eine Nachricht..."
            className="flex-1 bg-gray-800 border-gray-700 text-gray-200 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="bg-accent hover:bg-accent/90"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};