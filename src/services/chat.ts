import Groq from "groq-sdk";

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
  history: { role: string; content: string }[]
): Promise<ChatResponse> => {
  console.log("Sending message to Groq:", message);
  
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Du bist ein KI-Assistent, der entweder mit Text oder HTML-Fragmenten antwortet. 
          Wenn eine interaktive Antwort sinnvoll ist, antworte mit einem HTML-Fragment. 
          Antworte immer im JSON-Format mit "responsetype" ("text" oder "html") und "response" (der eigentliche Inhalt).
          Beispiele für gute HTML-Antworten sind Rechner, Karten oder interaktive Formulare.`,
        },
        ...history,
        { role: "user", content: message },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_completion_tokens: 32768,
      top_p: 1,
      stream: false,
      response_format: {
        type: "json_object",
      },
    });

    console.log("Groq response:", chatCompletion.choices[0]?.message?.content);
    
    return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.error("Error calling Groq:", error);
    return {
      responsetype: "text",
      response: "Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage.",
    };
  }
};