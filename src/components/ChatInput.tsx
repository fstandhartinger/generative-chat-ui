import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, RefreshCw, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  onNewChat: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, onNewChat }) => {
  const [message, setMessage] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedKey = localStorage.getItem('ANTHROPIC_API_KEY');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('ANTHROPIC_API_KEY', apiKey.trim());
      setShowApiKeyDialog(false);
      toast({
        title: "API Key Saved",
        description: "Your Anthropic API key has been saved successfully.",
      });
    }
  };

  const examples = [
    "How much net salary will remain from my gross income according to german law?",
    "Which regions in Southeast Asia are good for traveling in August regarding weather?",
    "I need a text generator for music reviews",
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-chatbg border-t border-gray-700 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-wrap gap-2">
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
          <div className="flex gap-2">
            <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-gray-200 border-gray-700 hover:bg-gray-800"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Anthropic API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 text-gray-200">
                <DialogHeader>
                  <DialogTitle>Set Anthropic API Key</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Anthropic API key"
                    className="bg-gray-700 border-gray-600 text-gray-200"
                  />
                  <Button onClick={handleSaveApiKey}>Save API Key</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={onNewChat}
              variant="outline"
              className="text-gray-200 border-gray-700 hover:bg-gray-800"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Send a message..."
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