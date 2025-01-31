import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
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
  const groqKey = localStorage.getItem('GROQ_API_KEY');
  const needShorterPrompt = groqKey ? true : false;
  const basePrompt = getSystemPrompt(needShorterPrompt);
  const serperKey = localStorage.getItem('SERPERDEV_API_KEY');
  const openaiKey = localStorage.getItem('OPENAI_API_KEY');
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

    // Image generation with DALL-E
    const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + openaiKey
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: "Your image generation prompt",
        n: 1,
        size: "1024x1024"
      })
    });
    const imageResult = await imageResponse.json();
    const imageUrl = imageResult.data[0].url; // URL of the generated image

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

  return enhancedPrompt;
};

export const sendMessage = async (
  message: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<ChatResponse> => {
  console.log("Sending message:", message);
  
  const anthropicKey = localStorage.getItem('ANTHROPIC_API_KEY');
  const r1Key = localStorage.getItem('R1DEEPSEEK_API_KEY');
  const groqKey = localStorage.getItem('GROQ_API_KEY');
  const openaiKey = localStorage.getItem('OPENAI_API_KEY');
  
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

  // Try OpenAI o3-mini first if available
  if (openaiKey) {
    console.log("Using OpenAI o3-mini API first");
    try {
      const openai = new OpenAI({
        apiKey: openaiKey,
        dangerouslyAllowBrowser: true,
      });

      const systemPrompt = getEnhancedSystemPrompt();
      const completion = await openai.chat.completions.create({
        model: "o3-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...history.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        reasoning_effort: "medium",
        response_format: { type: "json_object" }
      });

      const o3Response = completion.choices[0].message.content;
      if (o3Response) {
        try {
          const parsed = JSON.parse(o3Response);
          if (parsed.responsetype && parsed.response) {
            return parsed as ChatResponse;
          }
        } catch (e) {
          console.log("Failed to parse o3-mini response as ChatResponse, sending to Anthropic for review");
        }
      }
    } catch (error) {
      console.error("Error with OpenAI o3-mini, falling back to Groq:", error);
    }
  }

  // Try Groq if o3-mini failed or not available
  if (groqKey) {
    console.log("Using Groq API first");
    try {
      const groq = new Groq({
        apiKey: groqKey,
        dangerouslyAllowBrowser: true,
      });

      const systemPrompt = getEnhancedSystemPrompt();
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...history.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        model: "deepseek-r1-distill-llama-70b",
        temperature: 0.6,
        max_completion_tokens: 4096,
        top_p: 0.95,
        stream: false,
        stop: null
      });

      const groqResponse = completion.choices[0].message.content;
      if (groqResponse) {
        try {
          const parsed = JSON.parse(groqResponse);
          if (parsed.responsetype && parsed.response) {
            return parsed as ChatResponse;
          }
        } catch (e) {
          console.log("Failed to parse Groq response as ChatResponse, sending to Anthropic for review");
        }
      }
    } catch (error) {
      console.error("Error with Groq, falling back to R1:", error);
    }
  }

  // Try R1 if available and Groq failed or not available
  if (r1Key) {
    console.log("Using R1 Deepseek");
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
        // Send to Anthropic for review if the response contains code
        if (r1Response.includes('```') || r1Response.includes('&lt;script') || r1Response.includes('function')) {
          console.log("R1 generated code, sending to Anthropic for review");
          const reviewCompletion = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 8192,
            temperature: 0.7,
            system: `You are a code reviewer for code that was generated by another AI. Review the code for correctness, completeness, and functionality. If needed, improve the code to make it work better. Return the result in the specified JSON format with responsetype and response fields.
            
            This is the original system prompt, the other AI has had:
            <originalSystemPrompt>
            ${systemPrompt}
            </originalSystemPrompt>

            You must always (!) respond with a function call to the output_json function, which takes a JSON object in the format specified above as an argument.
            `,
            messages: [
              ...history.map(msg => ({
                role: msg.role,
                content: msg.content
              })),
              { 
                role: "user", 
                content: `Here's the code generated by another AI. Please review and improve if needed:\n\n${r1Response}` 
              }
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

          const reviewToolUseContent = reviewCompletion.content.find(c => c.type === 'tool_use');
          if (reviewToolUseContent?.input) {
            return reviewToolUseContent.input as ChatResponse;
          }
        }
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