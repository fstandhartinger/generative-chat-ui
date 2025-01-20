import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { sendMessage } from "@/services/chat";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string | React.ReactNode;
}

const AssistantResponse = ({ content }: { content: string }) => {
  useEffect(() => {
    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = content;
    
    // Find all external scripts and inline scripts
    const scripts = Array.from(container.getElementsByTagName('script'));
    const externalScripts = scripts.filter(script => script.src);
    const inlineScripts = scripts.filter(script => !script.src);
    
    // Function to load external script
    const loadExternalScript = (script: HTMLScriptElement): Promise<void> => {
      return new Promise((resolve, reject) => {
        const newScript = document.createElement('script');
        
        // Copy all attributes
        Array.from(script.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        newScript.onload = () => resolve();
        newScript.onerror = () => reject();
        
        document.body.appendChild(newScript);
      });
    };
    
    // Function to execute inline script
    const executeInlineScript = (script: HTMLScriptElement) => {
      const newScript = document.createElement('script');
      
      // Copy all attributes
      Array.from(script.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Execute script
      const scriptContent = script.innerHTML;
      newScript.innerHTML = `
        try {
          ${scriptContent}
        } catch (error) {
          console.error('Error executing script:', error);
        }
      `;
      
      document.body.appendChild(newScript);
      return newScript;
    };
    
    // Keep track of added scripts for cleanup
    const addedScripts: HTMLScriptElement[] = [];
    
    // Load all scripts in sequence
    const loadAllScripts = async () => {
      // First load all external scripts
      for (const script of externalScripts) {
        try {
          await loadExternalScript(script);
        } catch (error) {
          console.error('Error loading external script:', error);
        }
      }
      
      // Then execute inline scripts
      for (const script of inlineScripts) {
        const newScript = executeInlineScript(script);
        addedScripts.push(newScript);
      }
    };
    
    // Start loading scripts
    loadAllScripts();

    // Add the HTML content
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = content;
    // Remove script tags from the content to prevent double execution
    Array.from(contentDiv.getElementsByTagName('script')).forEach(script => script.remove());
    
    return () => {
      // Cleanup scripts on unmount
      addedScripts.forEach(script => {
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [content]);

  return <div dangerouslySetInnerHTML={{ __html: content }} />;
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  /*
  const showRateLimitToast = useCallback(() => {
    toast({
      variant: "destructive",
      description: "Currently problems with rate limits",
      duration: null // This makes it stay until manually dismissed
    });
  }, [toast]);

  useEffect(() => {
    showRateLimitToast();
  }, [showRateLimitToast]);
  */

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = () => {
    setMessages([]);
  };

  const handleSend = async (message: string) => {
    try {
      setIsLoading(true);
      const newMessages = [...messages, { role: "user" as const, content: message }];
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      const history = newMessages.map(({ role, content }) => ({
        role,
        content: typeof content === "string" ? content : "",
      }));

      const response = await sendMessage(message, history);
      
      // Update the last message (remove loading state and set content)
      setMessages(currentMessages => {
        const updatedMessages = [...currentMessages];
        updatedMessages[updatedMessages.length - 1] = {
          role: "assistant",
          content: response.responsetype === "html" 
            ? <AssistantResponse content={response.response} />
            : response.response
        };
        return updatedMessages;
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove the loading message on error
      setMessages(currentMessages => currentMessages.slice(0, -1));
      toast({
        title: "Error",
        description: "An error occurred while sending your message.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chatbg text-gray-200">
      <div className="h-[calc(100vh-var(--chat-input-height,0px))] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
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
              isLoading={index === messages.length - 1 && isLoading}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput 
        onSend={handleSend} 
        isLoading={isLoading} 
        onNewChat={handleNewChat}
      />
    </div>
  );
};

export default Index;
