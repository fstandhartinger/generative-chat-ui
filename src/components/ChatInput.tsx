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
  const [apiKeys, setApiKeys] = useState({
    anthropic: "",
    r1deepseek: "",
    openai: "",
    replicate: "",
    serperdev: ""
  });
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load all saved API keys
    const savedKeys = {
      anthropic: localStorage.getItem('ANTHROPIC_API_KEY') || "",
      r1deepseek: localStorage.getItem('R1_DEEPSEEK_API_KEY') || "",
      openai: localStorage.getItem('OPENAI_API_KEY') || "",
      replicate: localStorage.getItem('REPLICATE_API_KEY') || "",
      serperdev: localStorage.getItem('SERPERDEV_API_KEY') || ""
    };
    setApiKeys(savedKeys);

    if (!savedKeys.anthropic) {
      toast({
        title: "API Keys Required",
        description: "At minimum, please provide an Anthropic API key. Additional API keys unlock more functionality.",
        variant: "destructive",
        duration: 10000,
      });
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleSaveApiKeys = () => {
    if (!apiKeys.anthropic.trim()) {
      toast({
        title: "Error",
        description: "Anthropic API key is required",
        variant: "destructive",
      });
      return;
    }

    // Save all API keys to localStorage
    Object.entries(apiKeys).forEach(([key, value]) => {
      if (value.trim()) {
        localStorage.setItem(`${key.toUpperCase()}_API_KEY`, value.trim());
      } else {
        localStorage.removeItem(`${key.toUpperCase()}_API_KEY`);
      }
    });

    setShowApiKeyDialog(false);
    toast({
      title: "API Keys Saved",
      description: "Your API keys have been saved successfully.",
    });
  };

  const examples = [
    {
      shortText: "What are the best regions to visit in Southeast Asia in August...",
      fullText: "What are the best regions to visit in Southeast Asia in August? I need to know which areas have favorable weather conditions during this time. Important factors include rainfall (monsoon season), temperature, and humidity. I'm particularly interested in an overview of regions that are ideal, acceptable, or unfavorable for travel, with detailed information about the respective weather conditions."
    },
    {
      shortText: "Help me create song reviews for my playlist based on melody, vocals, and beat...",
      fullText: "Help me create song reviews for my playlist based on melody, vocals, and beat. I need to create a brief textual assessment for each song generated that explains my decision whether I include it in my Spotify playlist or not. I want to evaluate different aspects like melody, vocals, beat, and lyrics (good/bad) individually and than give my decision (accept or reject) and then receive a review text that is justified by the individual ratings."
    },
    {
      shortText: "Calculate net salary from gross income in Germany...",
      fullText: "Calculate net salary from gross income in Germany? I want to understand how much of my gross annual salary remains after all deductions. Factors to consider include my tax class, whether I pay church tax, and other relevant aspects. I need a breakdown of all deductions (income tax, solidarity surcharge, health insurance, etc.) and the resulting monthly net amount."
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-chatbg border-t border-gray-700 p-4">
      <div className="max-w-3xl mx-auto" ref={(el) => {
        if (el) {
          const height = el.getBoundingClientRect().height;
          const totalHeight = height + 32;
          document.documentElement.style.setProperty('--chat-input-height', `${totalHeight}px`);
        }
      }}>
        <div className="flex flex-col space-y-4 mb-4">
          <div className="flex justify-end gap-2">
            <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                >
                  <Key className="mr-2 h-4 w-4" />
                  API Keys
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 text-gray-200">
                <DialogHeader>
                  <DialogTitle>Configure API Keys</DialogTitle>
                  <DialogDescription className="text-gray-300">
                    Enter your API keys to unlock different capabilities. At minimum, the Anthropic API key is required.
                    Your keys will be stored only on your device and never transmitted to our servers.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Anthropic API Key (Required)</label>
                    <Input
                      type="password"
                      value={apiKeys.anthropic}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                      placeholder="Enter your Anthropic API key"
                      className="bg-gray-700 border-gray-600 text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">R1 Deepseek API Key</label>
                    <Input
                      type="password"
                      value={apiKeys.r1deepseek}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, r1deepseek: e.target.value }))}
                      placeholder="Enter your R1 Deepseek API key"
                      className="bg-gray-700 border-gray-600 text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">OpenAI API Key</label>
                    <Input
                      type="password"
                      value={apiKeys.openai}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                      placeholder="Enter your OpenAI API key"
                      className="bg-gray-700 border-gray-600 text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Replicate API Key</label>
                    <Input
                      type="password"
                      value={apiKeys.replicate}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, replicate: e.target.value }))}
                      placeholder="Enter your Replicate API key"
                      className="bg-gray-700 border-gray-600 text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Serper.dev API Key</label>
                    <Input
                      type="password"
                      value={apiKeys.serperdev}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, serperdev: e.target.value }))}
                      placeholder="Enter your Serper.dev API key"
                      className="bg-gray-700 border-gray-600 text-gray-200"
                    />
                  </div>
                  <Button onClick={handleSaveApiKeys}>Save API Keys</Button>
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
