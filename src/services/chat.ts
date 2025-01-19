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
  
  let initialResponse = "";
  
  if (anthropicKey) {
    console.log("Using Anthropic API first");
    try {
      const anthropic = new Anthropic({
        apiKey: anthropicKey,
        dangerouslyAllowBrowser: true,
      });

      const chatCompletion = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4096,
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
          Choose text for informational responses like emails or explanations.
          
          Try to format your response as a JSON object with this structure:
          {
            "responsetype": "text" or "html",
            "response": "your response content"
          }`,
        messages: [
          ...history.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: "user", content: message }
        ],
      });

      initialResponse = chatCompletion.content[0].type === 'text' 
        ? chatCompletion.content[0].text
        : '';
        
      console.log("Anthropic response:", initialResponse);

      // Try to parse the response as JSON first
      try {
        const parsedResponse = JSON.parse(initialResponse);
        if (parsedResponse.responsetype && parsedResponse.response) {
          console.log("Successfully parsed Anthropic response as JSON");
          return parsedResponse;
        }
      } catch (parseError) {
        console.log("Anthropic response is not valid JSON, will use Groq for formatting");
      }
    } catch (error) {
      console.error("Error calling Anthropic:", error);
      initialResponse = "Sorry, there was an error processing your request.";
    }
  }

  // If no Anthropic key is present or an error occurred, 
  // use Groq directly
  if (!anthropicKey || initialResponse === "Sorry, there was an error processing your request.") {
    try {
      console.log("Using Groq directly");
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
        max_tokens: 32768,
        top_p: 1,
        stream: false,
        response_format: {
          type: "json_object"
        }
      });

      console.log("Groq direct response:", chatCompletion.choices[0]?.message?.content);
      return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
    } catch (error) {
      console.error("Error calling Groq directly:", error);
      return {
        responsetype: "text",
        response: "Sorry, there was an error processing your request.",
      };
    }
  }

  // If we have a response from Anthropic, let Groq format it into the desired structure
  try {
    console.log("Using Groq to format Anthropic response");
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a JSON formatting assistant. You will receive a response from Claude-3 Sonnet, 
          a highly capable LLM that excels at creating HTML and JavaScript code. Your task is to format 
          this response into a specific JSON structure.

          The response might already be in JSON format, but if it's not, you need to analyze it and create 
          the appropriate JSON structure. The response will either be a text explanation or an HTML fragment.

          Rules:
          1. If the response contains HTML tags or looks like a UI component, set responsetype to "html"
          2. If it's a plain text explanation, set responsetype to "text"
          3. Only make minimal necessary corrections to the HTML/JavaScript if you're absolutely certain 
             something needs to be fixed
          4. Preserve all functionality and styling of HTML fragments
          5. Keep the exact text content for text responses

          Required JSON structure:
          {
            "responsetype": "text" | "html",
            "response": "string" // The actual content
          }

          Context about the app:
          - It's a chat interface that can display both text responses and interactive HTML components
          - HTML components should use Tailwind CSS classes and match the dark theme
          - The app supports fully interactive components with JavaScript functionality`,
        },
        {
          role: "user",
          content: initialResponse,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 32768,
      top_p: 1,
      stream: false,
      response_format: {
        type: "json_object"
      }
    });

    console.log("Groq formatting response:", chatCompletion.choices[0]?.message?.content);
    return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.error("Error in final Groq formatting:", error);
    return {
      responsetype: "text",
      response: "Sorry, there was an error processing your request.",
    };
  }
};