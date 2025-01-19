import Groq from "groq-sdk";
import { Anthropic } from '@anthropic-ai/sdk';
import { getSystemPrompt } from '@/utils/promptExamples';

const apiKeys = [
  "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",
  "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",
  "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",
  "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",
  "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",
  "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"
];

const groq = new Groq({  
  apiKey: apiKeys[Math.floor(Math.random() * apiKeys.length)],
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
  const systemPrompt = getSystemPrompt();
  const jsonFormatPrompt = `${systemPrompt}\n\nIMPORTANT: You must format your response as a JSON object with exactly two fields:\n1. "responsetype": Either "text" or "html"\n2. "response": Your actual response content as a string\n\nFor example: {"responsetype": "text", "response": "Hello world"}`;
  
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
        system: jsonFormatPrompt,
        messages: [
          ...history.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: "user", content: message }
        ]
      });

      initialResponse = chatCompletion.content[0].type === 'text' 
        ? chatCompletion.content[0].text
        : '';
        
      console.log("Anthropic response:", initialResponse);

      try {
        const parsedResponse = JSON.parse(initialResponse);
        if (parsedResponse.responsetype && parsedResponse.response) {
          console.log("Successfully parsed Anthropic response as JSON");
          return parsedResponse;
        }
        console.log("Anthropic response missing required fields, falling back to Groq");
      } catch (parseError) {
        console.log("Anthropic response is not valid JSON:", parseError);
      }
    } catch (error) {
      console.error("Error calling Anthropic:", error);
      initialResponse = "Sorry, there was an error processing your request.";
    }
  }

  // Fallback to Groq if no Anthropic key or error occurred
  try {
    console.log("Using Groq as fallback");
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
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

    console.log("Groq response:", chatCompletion.choices[0]?.message?.content);
    return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.error("Error in Groq fallback:", error);
    return {
      responsetype: "text",
      response: "Sorry, there was an error processing your request.",
    };
  }
};
