import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, RefreshCw, Key, Mic, Square, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  onNewChat: () => void;
  showExamples?: boolean;
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  isLoading, 
  onNewChat, 
  showExamples = true,
  className = "" 
}) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [randomExamples, setRandomExamples] = useState<typeof examples>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [apiKeys, setApiKeys] = useState({
    anthropic: "",
    r1deepseek: "",
    openai: "",
    serperdev: ""
  });
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load all saved API keys
    const savedKeys = {
      anthropic: localStorage.getItem('ANTHROPIC_API_KEY') || "",
      r1deepseek: localStorage.getItem('R1DEEPSEEK_API_KEY') || "",
      openai: localStorage.getItem('OPENAI_API_KEY') || "",
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

    // Initialize random examples
    setRandomExamples(examples.sort(() => Math.random() - 0.5).slice(0, 2));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If this was triggered by Enter key, let the onKeyDown handler handle it
    if (e.nativeEvent instanceof KeyboardEvent && e.nativeEvent.key === 'Enter') {
      return;
    }
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
    },
    {
      shortText: "I'd love to hear a podcast about siamese cats",
      fullText: "I'd love to hear a podcast about siamese cats. Can you also generate a matching cover image and give me a podcast player?"
    },
    {
      shortText: "What's the time in Sydney?",
      fullText: "What's the time in Sydney?"
    },
    {
      shortText: "Can you explain me why PI is 3.14?",
      fullText: "Can you explain me why PI is 3.14?"
    },        
    {
      shortText: "I want to play a game of tetris",
      fullText: "I want to play a game of tetris"
    },            
    {
      shortText: "I need to note down some todo items",
      fullText: "I need to note down some todo items"
    },            
    {
      shortText: "I want to take notes by speaking",
      fullText: "I want to take notes by speaking into the microphone, show me the transcribed text but then also rephrase it in a way that is easy to read and understand."
    },            
    {
      shortText: "I want to learn french",
      fullText: "I want to learn french. How about you show me english sentences and I try to say their translation in french and then you correct me?"
    },            
    {
      shortText: "Where are the most beautiful sand beaches in crete?",
      fullText: "Where are the most beautiful sand beaches in crete?"
    }    
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check your permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    const openaiKey = localStorage.getItem('OPENAI_API_KEY');
    if (!openaiKey) {
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "OpenAI API key is required for voice transcription.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");
      formData.append("model", "whisper-1");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + openaiKey
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessage(data.text);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Error",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div className={`bg-chatbg border-t border-gray-700 p-4 ${className}`}>
      <div className="max-w-3xl mx-auto" ref={(el) => {
        if (el) {
          const height = el.getBoundingClientRect().height;
          const totalHeight = height + 32;
          document.documentElement.style.setProperty('--chat-input-height', `${totalHeight}px`);
        }
      }}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
              placeholder="Send a message..."
              className="flex-1 bg-gray-800 border-gray-700 text-gray-200 resize-none pr-10 min-h-[40px] max-h-[200px] overflow-y-auto scrollbar scrollbar-w-1 scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            {apiKeys.openai && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-gray-700"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isRecording ? (
                  <Square className="h-4 w-4 text-red-500" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <Button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="bg-accent hover:bg-accent/90"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </form>

        {showExamples && (
          <div className="mt-8 space-y-4">
            <div className="text-sm text-gray-400">Try an example:</div>
            <div className="flex flex-wrap gap-3">
              {randomExamples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setMessage(example.fullText);
                  }}
                  className="px-3 py-1.5 bg-gray-800/50 text-gray-400 hover:text-gray-200 rounded-lg text-sm transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
                  title={example.fullText}
                >
                  {example.shortText}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
