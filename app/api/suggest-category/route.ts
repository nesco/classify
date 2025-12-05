import { NextResponse } from "next/server";
import { suggestCategory } from "@/lib/llm";
import type { Category } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { examples, existingCategories } = body as {
      examples: string[];
      existingCategories: Category[];
    };

    if (!examples || examples.length === 0) {
      return NextResponse.json({ error: "Examples required" }, { status: 400 });
    }

    const suggestion = await suggestCategory(examples, existingCategories || []);

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("Failed to suggest category:", error);
    return NextResponse.json({ error: "Failed to suggest category" }, { status: 500 });
  }
}
