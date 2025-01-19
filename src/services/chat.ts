import Groq from "groq-sdk";
import { Anthropic } from '@anthropic-ai/sdk';
import { getSystemPrompt } from '@/utils/promptExamples';

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
  const systemPrompt = getSystemPrompt();
  
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
        system: systemPrompt,
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

  if (!anthropicKey || initialResponse === "Sorry, there was an error processing your request.") {
    try {
      console.log("Using Groq directly");
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


  try {
    console.log("Using Groq to format Anthropic response");
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `${systemPrompt} 
          
          We have already a response from the Anthropic LLM, which is leading in HTML Fragment generation quality, but the response was not valid JSON, so we need to format it to valid JSON.
          Don't change anything in the content of the HTML fragment (if it is a html fragment), except if you see obvious errors that needs to be fixed, your core task is just to format it to valid JSON.`,
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
