import { NextResponse } from "next/server";
import { getClassifier, saveClassifier } from "@/lib/storage";
import { classify } from "@/lib/llm";
import type { ClassificationRecord } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classifierId, text } = body;

    if (!classifierId || !text) {
      return NextResponse.json({ error: "Classifier ID and text required" }, { status: 400 });
    }

    const classifier = await getClassifier(classifierId);

    if (!classifier) {
      return NextResponse.json({ error: "Classifier not found" }, { status: 404 });
    }

    if (classifier.categories.length === 0) {
      return NextResponse.json({ error: "Classifier has no categories" }, { status: 400 });
    }

    // Call LLM to classify
    const result = await classify(classifier.categories, text);

    // Create classification record
    const record: ClassificationRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      text,
      categoryId: result.categoryId,
      confidence: result.confidence,
      explanation: result.explanation,
      timestamp: new Date().toISOString(),
    };

    // Add to classifier history
    classifier.history.push(record);
    await saveClassifier(classifier);

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Classification failed:", error);
    return NextResponse.json(
      { error: "Classification failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
