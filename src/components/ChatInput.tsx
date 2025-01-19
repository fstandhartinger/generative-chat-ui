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
      shortText: "Welche Regionen in Südostasien eignen sich für Reisen im August?",
      fullText: "Welche Regionen in Südostasien eignen sich für Reisen im August? Ich möchte wissen, welche Gebiete zu dieser Zeit günstige Wetterbedingungen haben. Wichtige Faktoren sind dabei Niederschlag (Monsunzeit), Temperatur und Luftfeuchtigkeit. Ich interessiere mich besonders für eine Übersicht der Regionen, die ideal (grün), akzeptabel (gelb) oder ungünstig (rot) für Reisen sind, mit detaillierten Informationen zu den jeweiligen Wetterbedingungen."
    },
    {
      shortText: "Musikstücke für Playlist bewerten mit Kriterien wie Melodie, Gesang und Beat...",
      fullText: "Musikstücke für Playlist bewerten mit Kriterien wie Melodie, Gesang und Beat. Ich muss für jedes Musikstück eine kurze Bewertung erstellen, die zu einer Entscheidung führt, ob das Stück in meine Spotify-Playlist aufgenommen wird. Dabei möchte ich verschiedene Aspekte wie Melodie, Gesang, Beat und Lyrics einzeln bewerten können und am Ende zu einem klaren Urteil (Aufnehmen oder Ablehnen) kommen, das durch die Einzelbewertungen begründet wird."
    },
    {
      shortText: "Wie viel Netto bleibt von meinem Brutto-Gehalt nach deutschem Steuerrecht?",
      fullText: "Wie viel Netto bleibt von meinem Brutto-Gehalt nach deutschem Steuerrecht? Ich möchte verstehen, wie viel von meinem Brutto-Jahresgehalt nach allen Abzügen übrig bleibt. Dabei sind Faktoren wie meine Steuerklasse, ob ich Kirchensteuer zahle und andere relevante Aspekte zu berücksichtigen. Ich brauche eine Aufschlüsselung aller Abzüge (Einkommensteuer, Solidaritätszuschlag, Krankenversicherung, etc.) und den resultierenden monatlichen Netto-Betrag."
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