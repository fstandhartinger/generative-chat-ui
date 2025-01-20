import { Anthropic } from '@anthropic-ai/sdk';
import { getSystemPrompt, HTML_EXAMPLES } from '@/utils/promptExamples';

export interface ChatResponse {
  responsetype: "text" | "html";
  response: string;
}

export const sendMessage = async (
  message: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<ChatResponse> => {
  console.log("Sending message:", message);
  
  const anthropicKey = localStorage.getItem('ANTHROPIC_API_KEY');
  const systemPrompt = getSystemPrompt();  
  
  if (!anthropicKey) {
      return {
        responsetype: "text",
        response: "Please provide the Anthropic API Key",
      };
  }

    console.log("Using Anthropic API first");
    try {
      const anthropic = new Anthropic({
        apiKey: anthropicKey,
        dangerouslyAllowBrowser: true,
      });

      const chatCompletion = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 8192,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          ...history.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: "user", content: message }
        ],
        tools: [
          {
            "name": "oputput_json",
            "description": "output the chat response in the predefined format",
            "input_schema": {
              "type": "object",
              "properties": {
                "responsetype": {
                  "type": "string",
                  "description": "needs to be either 'text' or 'html'"
                },
                "response": {
                  "type": "string",
                  "description": "your response content, which could be either a self-contained html fragment (including all needed js and css) or a response in textual form"
                }
              },
              "required": [
                "responsetype",
                "response"
              ]
            }
          }
        ]
      });

      const toolUseContent = chatCompletion.content.find(c => c.type === 'tool_use');      
        
      console.log("Anthropic response:", toolUseContent);

      const result = toolUseContent.input as ChatResponse;

      if (!result) {
        return {
          responsetype: "text",
          response: "Sorry, there was an error processing your request.",
        };
      }

      return result;  

    } catch (error) {
      console.error("Error sending message:", error);
      return {
        responsetype: "text",
        response: "Sorry, there was an error processing your request.",
      };
    }
  
};