export interface Classifier {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  categories: Category[];
  history: ClassificationRecord[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color?: string;
  examples: string[]; // User + feedback combined
}

export interface ClassificationRecord {
  id: string;
  text: string;
  categoryId: string | null; // null = unclassified
  confidence: "low" | "medium" | "high";
  explanation: string;
  feedback?: "correct" | "incorrect";
  correctedCategoryId?: string;
  timestamp: string;
}

export interface ClassifyOutput {
  categoryId: string;
  confidence: "low" | "medium" | "high";
  explanation: string;
}
