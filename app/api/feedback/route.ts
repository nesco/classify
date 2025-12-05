import { NextResponse } from "next/server";
import { getClassifier, saveClassifier } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classifierId, historyId, feedback, correctedCategoryId } = body;

    if (!classifierId || !historyId || !feedback) {
      return NextResponse.json(
        { error: "Classifier ID, history ID, and feedback required" },
        { status: 400 }
      );
    }

    const classifier = await getClassifier(classifierId);

    if (!classifier) {
      return NextResponse.json({ error: "Classifier not found" }, { status: 404 });
    }

    const record = classifier.history.find((h) => h.id === historyId);

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    record.feedback = feedback;

    if (feedback === "correct") {
      const category = classifier.categories.find((c) => c.id === record.categoryId);
      if (category && !category.examples.includes(record.text)) {
        category.examples.push(record.text);
      }
    } else if (feedback === "incorrect" && correctedCategoryId) {
      record.correctedCategoryId = correctedCategoryId;
      const correctCategory = classifier.categories.find((c) => c.id === correctedCategoryId);
      if (correctCategory && !correctCategory.examples.includes(record.text)) {
        correctCategory.examples.push(record.text);
      }
    }

    await saveClassifier(classifier);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to process feedback:", error);
    return NextResponse.json({ error: "Failed to process feedback" }, { status: 500 });
  }
}
