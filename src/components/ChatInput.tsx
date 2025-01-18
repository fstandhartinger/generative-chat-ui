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
    {
      shortText: "Which regions in Southeast Asia are good for traveling in August regarding weather?",
      fullText: "I'm planning to travel to Southeast Asia in August. Could you create an interactive map showing which regions have favorable weather conditions during this time? Please consider factors like rainfall (monsoon season), temperature, and humidity. I'd like to see the regions color-coded (green for ideal, yellow for acceptable, red for unfavorable conditions) on a map, with tooltips explaining the specific weather patterns for each region."
    },
    {
      shortText: "I need a text generator for music reviews",
      fullText: "I need an interface to help me generate music reviews for songs that I'm considering adding to my playlist. The interface should include options to rate different aspects of the song (melody, vocals, beat, lyrics, etc.) using checkboxes or radio buttons, and three main verdict buttons (Accept, Neutral, Reject). When I click one of these buttons, it should generate a review text that reflects my ratings of the individual aspects. The review should explain why I made this decision, highlighting both positive and negative aspects I selected."
    },
    {
      shortText: "How much net salary will remain from my gross income according to german law?",
      fullText: "Could you create a German net salary calculator that helps me understand how much of my gross income will remain after taxes and deductions? I need an interface where I can input my annual gross salary, tax class, whether I pay church tax, and other relevant factors. The calculator should provide an approximate breakdown of all deductions (income tax, solidarity surcharge, health insurance, etc.) and show the estimated monthly net salary. Please include a note that this is an approximation and might not reflect all individual circumstances."
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
                className="px-4 py-2 bg-gray-800 text-gray-200 rounded-full text-sm hover:bg-gray-700 transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] md:max-w-[300px]"
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