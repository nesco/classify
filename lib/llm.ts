import { b } from "@/baml_client";
import {
  Confidence,
  type Category as BamlCategory,
  type ClassifyOutput as BamlClassifyOutput,
  type CategorySuggestion,
} from "@/baml_client/types";
import type { Category, ClassifyOutput } from "./types";

function mapConfidence(confidence: Confidence): "low" | "medium" | "high" {
  switch (confidence) {
    case Confidence.Low:
      return "low";
    case Confidence.Medium:
      return "medium";
    case Confidence.High:
      return "high";
  }
}

function toBamlCategory(category: Category): BamlCategory {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    examples: category.examples,
  };
}

export async function classify(
  categories: Category[],
  text: string
): Promise<ClassifyOutput> {
  const bamlCategories = categories.map(toBamlCategory);
  const result: BamlClassifyOutput = await b.Classify(bamlCategories, text);

  return {
    categoryId: result.categoryId,
    confidence: mapConfidence(result.confidence),
    explanation: result.explanation,
  };
}

export async function suggestCategory(
  examples: string[],
  existingCategories: Category[]
): Promise<CategorySuggestion> {
  const bamlCategories = existingCategories.map(toBamlCategory);
  return b.SuggestCategory(examples, bamlCategories);
}
