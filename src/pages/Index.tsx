import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { sendMessage } from "@/services/chat";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw, Key } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    anthropic: "",
    r1deepseek: "",
    openai: "",
    replicate: "",
    serperdev: ""
  });

  useEffect(() => {
    // Load all saved API keys
    const savedKeys = {
      anthropic: localStorage.getItem('ANTHROPIC_API_KEY') || "",
      r1deepseek: localStorage.getItem('R1DEEPSEEK_API_KEY') || "",
      openai: localStorage.getItem('OPENAI_API_KEY') || "",
      replicate: localStorage.getItem('REPLICATE_API_KEY') || "",
      serperdev: localStorage.getItem('SERPERDEV_API_KEY') || ""
    };
    setApiKeys(savedKeys);
  }, []);

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
      {/* Top bar */}
      <div className="h-14 border-b border-gray-800 bg-gray-900/50 backdrop-blur fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4">
        {messages.length > 0 && (
          <Button
            onClick={handleNewChat}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        )}
        <div className="flex-1" />
        <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-200"
            >
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 text-gray-200 sm:max-w-[425px]">
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
      </div>

      {/* Main content with top padding for the fixed header */}
      <div className={`pt-14 h-[calc(100vh-var(--chat-input-height,0px))] overflow-y-auto ${messages.length === 0 ? 'flex items-center justify-center' : ''}`}>
        {messages.length === 0 ? (
          <div className="w-full max-w-3xl mx-auto px-4 flex flex-col items-center -mt-14">
            <h1 className="text-4xl font-bold text-gray-500 mb-8 text-center">
              Generative UI Chat
            </h1>
            <div className="w-full">
              <ChatInput 
                onSend={handleSend} 
                isLoading={isLoading} 
                onNewChat={handleNewChat}
                showExamples={true}
                className="relative bg-transparent"
              />
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
                isLoading={index === messages.length - 1 && isLoading}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {messages.length > 0 && (
        <ChatInput 
          onSend={handleSend} 
          isLoading={isLoading} 
          onNewChat={handleNewChat}
          showExamples={false}
          className="fixed bottom-0 left-0 right-0 bg-chatbg/80 backdrop-blur"
        />
      )}
    </div>
  );
};

export default Index;
