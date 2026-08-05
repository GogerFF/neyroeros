import type { AiMetadataProvider } from "./provider";

export class MockAiMetadataProvider implements AiMetadataProvider {
  readonly name = "mock";
  readonly model = "mock-vision-v1";

  async analyzeImage(_input: Buffer) {
    void _input;
    return {
      description: "Атмосферная цифровая работа с выразительным светом.",
      tags: ["цифровое искусство", "атмосфера"],
      category: "digital-art",
      confidence: 0.72,
    };
  }

  async improveDescription(text: string) {
    return `${text.trim()} — выразительная авторская AI-композиция.`;
  }
}
