import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { getSystemPrompt, HTML_EXAMPLES } from '@/utils/promptExamples';

export interface ChatResponse {
  responsetype: "text" | "html";
  response: string;
}

const formatR1Response = async (r1Response: string, anthropic: Anthropic): Promise<ChatResponse> => {
  try {
    const parsed = JSON.parse(r1Response);
    if (parsed.responsetype && parsed.response) {
      return parsed;
    }
  } catch (e) {
    // If parsing fails or format is wrong, use Anthropic to format it
    const chatCompletion = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      temperature: 0.7,
      system: "Format the following response into a ChatResponse object with responsetype (text or html) and response fields",
      messages: [
        { role: "user", content: `Format this response as a ChatResponse: ${r1Response}` }
      ],
      tools: [{
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
              "description": "your response content"
            }
          },
          "required": ["responsetype", "response"]
        }
      }]
    });

    const toolUseContent = chatCompletion.content.find(c => c.type === 'tool_use');
    return toolUseContent?.input as ChatResponse;
  }
  
  return {
    responsetype: "text",
    response: r1Response
  };
};

const getEnhancedSystemPrompt = () => {
  const basePrompt = getSystemPrompt();
  const serperKey = localStorage.getItem('SERPERDEV_API_KEY');
  const openaiKey = localStorage.getItem('OPENAI_API_KEY');
  const replicateKey = localStorage.getItem('REPLICATE_API_KEY');
  const r1Key = localStorage.getItem('R1DEEPSEEK_API_KEY');
  
  let enhancedPrompt = basePrompt;

  if (r1Key) {
    enhancedPrompt += `\n\nYou can and should use R1 Deepseek for LLM calls in your HTML fragments. Example:
    const r1Key = localStorage.getItem('R1DEEPSEEK_API_KEY');
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + r1Key
      },
      body: JSON.stringify({
        model: "deepseek-reasoner",
        messages: [{"role": "user", "content": "Your prompt here"}]
      })
    });
    const result = await response.json();
    const llmResponse = result.choices[0].message.content; // This contains the actual response text
    `;
  }

  if (serperKey) {
    enhancedPrompt += `\n\nYou can use Google Search in your HTML fragments using the serper.dev API. Example:
    const serperKey = localStorage.getItem('SERPERDEV_API_KEY');
    const requestOptions = {
      method: "GET",
      redirect: "follow"
    };
    
    try {
      const response = await fetch("https://google.serper.dev/search?q=" + encodeURIComponent(searchQuery) + "&apiKey=" + serperKey, requestOptions);
      const result = await response.json();
      // Result will contain searchParameters, knowledgeGraph, and organic results
      console.log(result);
    } catch (error) {
      console.error(error);
    };`;
  }

  if (openaiKey) {
    enhancedPrompt += `\n\nYou can use OpenAI's APIs in your HTML fragments:
    
    const openaiKey = localStorage.getItem('OPENAI_API_KEY');
    
    // Text generation
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + openaiKey
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{"role": "user", "content": "Your prompt here"}],
        temperature: 0.7
      })
    });

    // Text-to-Speech
    const audioResponse = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + openaiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "tts-1",
        input: "Text to convert to speech",
        voice: "alloy"
      })
    });
    const audioBlob = await audioResponse.blob();
    
    // Speech-to-Text (requires audio file, which could also come from recoding the users voice via microphone)
    const formData = new FormData();
    formData.append("file", audioFile);
    formData.append("model", "whisper-1");
    
    const transcriptionResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + openaiKey
      },
      body: formData
    });`;
  }

  if (replicateKey) {
    enhancedPrompt += `\n\nYou can use Replicate's APIs in your HTML fragments for image generation:
    
    const replicateKey = localStorage.getItem('REPLICATE_API_KEY');
    const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + replicateKey,
        "Content-Type": "application/json",
        "Prefer": "wait"
      },
      body: JSON.stringify({
        input: {
          prompt: "Your image generation prompt",
          guidance: 3.5
        }
      })
    });
    const result = await response.json();
    // result will contain array of image URLs`;
  }

  return enhancedPrompt;
};

export const sendMessage = async (
  message: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<ChatResponse> => {
  console.log("Sending message:", message);
  
  const anthropicKey = localStorage.getItem('ANTHROPIC_API_KEY');
  const r1Key = localStorage.getItem('R1DEEPSEEK_API_KEY');
  
  if (!anthropicKey) {
    return {
      responsetype: "text",
      response: "Please provide the Anthropic API Key",
    };
  }

  // Initialize Anthropic client for potential formatting needs
  const anthropic = new Anthropic({
    apiKey: anthropicKey,
    dangerouslyAllowBrowser: true,
  });

  // Try R1 first if available
  if (r1Key) {
    console.log("Using R1 Deepseek first");
    try {
      const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: r1Key,
        dangerouslyAllowBrowser: true,
      });

      const systemPrompt = getEnhancedSystemPrompt();
      const completion = await openai.chat.completions.create({
        model: "deepseek-reasoner",
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ]
      });

      const r1Response = completion.choices[0].message.content;
      if (r1Response) {
        return formatR1Response(r1Response, anthropic);
      }
    } catch (error) {
      console.error("Error with R1, falling back to Anthropic:", error);
    }
  }

  console.log("Using Anthropic API");
  try {
    const chatCompletion = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8192,
      temperature: 0.7,
      system: getEnhancedSystemPrompt(),
      messages: [
        ...history.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
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

    const result = toolUseContent?.input as ChatResponse;

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