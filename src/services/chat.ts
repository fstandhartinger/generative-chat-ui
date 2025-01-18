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
          Choose text for informational responses like emails or explanations.

          Here are examples of when to use HTML fragments:

          Example 1: Net Salary Calculator
          When users ask about net salary calculations, respond with an HTML calculator that includes:
          - Input fields for gross salary, tax class, religion, etc.
          - JavaScript logic for German tax calculations
          - Clear display of results
          - Even if calculations are approximate, include a disclaimer
          - Styled to match dark theme with proper validation

          Example 2: Travel Weather Map
          For travel weather queries, create an HTML map that:
          - Uses OpenLayers/OpenStreetMap
          - Shows color-coded indicators (green/yellow/red)
          - Includes weather information overlays
          - Proper region highlighting
          - Interactive tooltips
          
          Example 3: Music Review Generator
          For music review requests, create an HTML interface with:
          - Input fields for artist and song name
          - Multiple choice buttons (Accept/Neutral/Reject)
          - Checkboxes for song aspects (melody, vocals, beat)
          - Generate review text directly in the UI without making external API calls
          - Display the generated review in a designated area within the same HTML fragment
          
          IMPORTANT: When creating interactive HTML fragments:
          1. DO NOT make external API calls from within the fragment
          2. Keep all functionality self-contained within the fragment
          3. Generate any text responses directly in JavaScript
          4. Use local event handlers only
          5. Avoid referencing external resources unless absolutely necessary
          
          When generating HTML:
          - Use classes like bg-gray-800 for dark backgrounds
          - text-gray-200 for light text
          - rounded-lg for rounded corners
          - p-4 for padding
          - hover:bg-gray-700 for hover states
          - border-gray-700 for borders`,
        messages: [
          ...history.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: "user", content: message }
        ]
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
          Choose text for informational responses like emails or explanations.

          Here are examples of when to use HTML fragments:

          Example 1: Net Salary Calculator
          When users ask about net salary calculations, respond with an HTML calculator that includes:
          - Input fields for gross salary, tax class, religion, etc.
          - JavaScript logic for German tax calculations
          - Clear display of results
          - Even if calculations are approximate, include a disclaimer
          - Styled to match dark theme with proper validation

          Example 2: Travel Weather Map
          For travel weather queries, create an HTML map that:
          - Uses OpenLayers/OpenStreetMap
          - Shows color-coded indicators (green/yellow/red)
          - Includes weather information overlays
          - Proper region highlighting
          - Interactive tooltips
          
          Example 3: Music Review Generator
          For music review requests, create an HTML interface with:
          - Input fields for artist and song name
          - Multiple choice buttons (Accept/Neutral/Reject)
          - Checkboxes for song aspects (melody, vocals, beat)
          - Generate review text directly in the UI without making external API calls
          - Display the generated review in a designated area within the same HTML fragment
          
          IMPORTANT: When creating interactive HTML fragments:
          1. DO NOT make external API calls from within the fragment
          2. Keep all functionality self-contained within the fragment
          3. Generate any text responses directly in JavaScript
          4. Use local event handlers only
          5. Avoid referencing external resources unless absolutely necessary
          
          When generating HTML:
          - Use classes like bg-gray-800 for dark backgrounds
          - text-gray-200 for light text
          - rounded-lg for rounded corners
          - p-4 for padding
          - hover:bg-gray-700 for hover states
          - border-gray-700 for borders`,
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