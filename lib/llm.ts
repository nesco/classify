import Anthropic from "@anthropic-ai/sdk";
import type { Category, ClassifyOutput } from "./types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const MODEL = "claude-sonnet-4-20250514";

function buildPrompt(categories: Category[], text: string): string {
  let prompt = "You are a classification assistant. Analyze the text and choose the most appropriate category.\n\n";
  prompt += "## Categories\n\n";

  categories.forEach((category) => {
    prompt += `### ${category.name} (id: ${category.id})\n`;
    prompt += `${category.description}\n`;

    if (category.examples.length > 0) {
      prompt += "Examples:\n";
      category.examples.forEach((example) => {
        prompt += `- "${example}"\n`;
      });
    }
    prompt += "\n";
  });

  prompt += `## Text to classify\n\n"${text}"\n\n`;
  prompt += `## Instructions\n\n`;
  prompt += `Respond ONLY with valid JSON (no markdown, no text before/after):\n\n`;
  prompt += `{\n`;
  prompt += `  "categoryId": "<chosen category id>",\n`;
  prompt += `  "confidence": "<confidence in the choice: 'low' | 'medium' | 'high'>",\n`;
  prompt += `  "explanation": "<clear and concise explanation in English>",\n`;
  prompt += `}`;

  return prompt;
}

export async function classify(categories: Category[], text: string): Promise<ClassifyOutput> {
  const prompt = buildPrompt(categories, text);

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (!content || content.type !== "text") {
    throw new Error("Unexpected response from LLM");
  }

  let jsonText = content.text.trim();
  jsonText = jsonText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");

  const result = JSON.parse(jsonText) as {
    categoryId: string;
    confidence: string;
    explanation: string;
  };

  return result
}
