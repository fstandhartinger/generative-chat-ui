import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { sendMessage } from "@/services/chat";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (message: string) => {
    try {
      setIsLoading(true);
      const newMessages = [...messages, { role: "user", content: message }];
      setMessages(newMessages);

      const history = newMessages.map(({ role, content }) => ({
        role,
        content,
      }));

      const response = await sendMessage(message, history);
      
      if (response.responsetype === "html") {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: (
              <div
                dangerouslySetInnerHTML={{ __html: response.response }}
              />
            ),
          },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: response.response },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Fehler",
        description: "Beim Senden der Nachricht ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chatbg text-gray-200">
      <div className="pb-32">
        {messages.length === 0 ? (
          <div className="h-screen flex items-center justify-center">
            <h1 className="text-4xl font-bold text-gray-500">
              Generative UI Chat
            </h1>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
};

export default Index;