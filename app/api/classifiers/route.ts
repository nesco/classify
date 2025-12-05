import { NextResponse } from "next/server";
import { getAllClassifiers, saveClassifier } from "@/lib/storage";
import type { Classifier } from "@/lib/types";

export async function GET() {
  try {
    const classifiers = await getAllClassifiers();
    return NextResponse.json({ classifiers });
  } catch (error) {
    console.error("Failed to get classifiers:", error);
    return NextResponse.json({ error: "Failed to load classifiers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid classifier name" }, { status: 400 });
    }

    const newClassifier: Classifier = {
      id: `clf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      description: description || "",
      createdAt: new Date().toISOString(),
      categories: [],
      history: [],
    };

    await saveClassifier(newClassifier);

    return NextResponse.json(newClassifier, { status: 201 });
  } catch (error) {
    console.error("Failed to create classifier:", error);
    return NextResponse.json({ error: "Failed to create classifier" }, { status: 500 });
  }
}
