import Groq from "groq-sdk";
import { Anthropic } from '@anthropic-ai/sdk';

const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true,
});

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
  
  if (anthropicKey) {
    console.log("Using Anthropic API");
    try {
      const anthropic = new Anthropic({
        apiKey: anthropicKey,
        dangerouslyAllowBrowser: true,
      });

      const chatCompletion = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096, // Reduced to a safe value below the 8,192 limit
        temperature: 0.7,
        system: `You are an AI assistant that responds either with text or HTML fragments. 
          When responding with HTML, ensure the fragment is:
          1. Completely self-contained with all necessary JavaScript functionality
          2. Styled to match the dark theme of the main application (bg-gray-800, text-gray-200, etc.)
          3. Uses modern, rounded UI elements with proper padding and spacing
          4. Includes error handling and validation where appropriate
          5. Provides clear feedback for user interactions
          6. Uses semantic HTML and ARIA attributes for accessibility
          
          Choose HTML fragments for interactive scenarios like calculators, maps, or forms.
          Choose text for informational responses like emails or explanations.`,
        messages: [
          ...history.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: "user", content: message }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_response",
            description: "Generate either a text or HTML response",
            parameters: {
              type: "object",
              properties: {
                responsetype: {
                  type: "string",
                  enum: ["text", "html"],
                  description: "The type of response to generate"
                },
                response: {
                  type: "string",
                  description: "The actual response content, either plain text or HTML"
                }
              },
              required: ["responsetype", "response"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_response" } }
      });

      const responseContent = chatCompletion.content[0].type === 'text' 
        ? chatCompletion.content[0].text
        : '';

      try {
        const parsedResponse = JSON.parse(responseContent);
        return parsedResponse;
      } catch {
        return {
          responsetype: "text",
          response: responseContent
        };
      }
    } catch (error) {
      console.error("Error calling Anthropic:", error);
      return {
        responsetype: "text",
        response: "Sorry, there was an error processing your request.",
      };
    }
  }

  // Fallback to Groq if no Anthropic key is present
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that responds either with text or HTML fragments. 
          When responding with HTML, ensure the fragment is:
          1. Completely self-contained with all necessary JavaScript functionality
          2. Styled to match the dark theme of the main application (bg-gray-800, text-gray-200, etc.)
          3. Uses modern, rounded UI elements with proper padding and spacing
          4. Includes error handling and validation where appropriate
          5. Provides clear feedback for user interactions
          6. Uses semantic HTML and ARIA attributes for accessibility
          
          Choose HTML fragments for interactive scenarios like calculators, maps, or forms.
          Choose text for informational responses like emails or explanations.`,
        },
        ...history.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: "user", content: message },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_completion_tokens: 32768,
      top_p: 1,
      stream: false,
    });

    console.log("Groq response:", chatCompletion.choices[0]?.message?.content);
    return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.error("Error calling Groq:", error);
    return {
      responsetype: "text",
      response: "Sorry, there was an error processing your request.",
    };
  }
};