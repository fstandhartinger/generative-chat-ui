import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, RefreshCw, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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
    if (!savedKey) {
      toast({
        title: "Anthropic API Key Required",
        description: "Please click the 'Anthropic API Key' button to set up your API key. Without it, the app will use a limited free model.",
        variant: "destructive",
        duration: 10000,
      });
    } else {
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
    {
      shortText: "What are the best regions to visit in Southeast Asia in August...",
      fullText: "What are the best regions to visit in Southeast Asia in August? I need to know which areas have favorable weather conditions during this time. Important factors include rainfall (monsoon season), temperature, and humidity. I'm particularly interested in an overview of regions that are ideal, acceptable, or unfavorable for travel, with detailed information about the respective weather conditions."
    },
    {
      shortText: "Help me evaluate songs for my playlist based on melody, vocals, and beat...",
      fullText: "Help me evaluate songs for my playlist based on melody, vocals, and beat. I need to create a brief assessment for each song that leads to a decision whether to include it in my Spotify playlist. I want to evaluate different aspects like melody, vocals, beat, and lyrics individually and arrive at a clear verdict (accept or reject) that is justified by the individual ratings."
    },
    {
      shortText: "Calculate net salary from gross income in Germany...",
      fullText: "Calculate net salary from gross income in Germany? I want to understand how much of my gross annual salary remains after all deductions. Factors to consider include my tax class, whether I pay church tax, and other relevant aspects. I need a breakdown of all deductions (income tax, solidarity surcharge, health insurance, etc.) and the resulting monthly net amount."
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-chatbg border-t border-gray-700 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col space-y-4 mb-4">
          <div className="flex justify-end gap-2">
            <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Anthropic API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 text-gray-200">
                <DialogHeader>
                  <DialogTitle>Set Anthropic API Key</DialogTitle>
                  <DialogDescription className="text-gray-300">
                    Enter your Anthropic API key to use Claude 3.5 Sonnet (New). Your key will be stored only on your device and never transmitted to our servers.
                    Without an API key, the app will fall back to a limited free model with strong rate limits.
                  </DialogDescription>
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
              className="bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => {
                  setMessage(example.fullText);
                }}
                className="px-4 py-2 bg-gray-800 text-gray-200 rounded-full text-sm hover:bg-gray-700 transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[190px] md:max-w-[290px]"
                title={example.fullText}
              >
                {example.shortText}
              </button>
            ))}
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
