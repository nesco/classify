import { NextResponse } from "next/server";
import { getClassifier, saveClassifier } from "@/lib/storage";
import type { Category } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: classifierId } = await context.params;
    const classifier = await getClassifier(classifierId);

    if (!classifier) {
      return NextResponse.json({ error: "Classifier not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, examples, color } = body;

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description required" }, { status: 400 });
    }

    const newCategory: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      description,
      color: color || "#3b82f6",
      examples: examples || [],
    };

    classifier.categories.push(newCategory);

    // Update any uncategorized history records whose text matches the examples
    if (examples && examples.length > 0) {
      const exampleSet = new Set(examples);
      for (const record of classifier.history) {
        if (record.categoryId === null && exampleSet.has(record.text)) {
          record.categoryId = newCategory.id;
          record.feedback = "incorrect";
          record.correctedCategoryId = newCategory.id;
        }
      }
    }

    await saveClassifier(classifier);

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id: classifierId } = await context.params;
    const classifier = await getClassifier(classifierId);

    if (!classifier) {
      return NextResponse.json({ error: "Classifier not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id: categoryId, name, description, examples, color } = body;

    if (!categoryId) {
      return NextResponse.json({ error: "Category ID required" }, { status: 400 });
    }

    const categoryIndex = classifier.categories.findIndex((c) => c.id === categoryId);

    if (categoryIndex === -1) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const existingCategory = classifier.categories[categoryIndex]!;

    classifier.categories[categoryIndex] = {
      id: existingCategory.id,
      name: name || existingCategory.name,
      description: description || existingCategory.description,
      examples: examples !== undefined ? examples : existingCategory.examples,
      color: color || existingCategory.color,
    };

    await saveClassifier(classifier);

    return NextResponse.json(classifier.categories[categoryIndex]);
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id: classifierId } = await context.params;
    const classifier = await getClassifier(classifierId);

    if (!classifier) {
      return NextResponse.json({ error: "Classifier not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json({ error: "Category ID required" }, { status: 400 });
    }

    const categoryIndex = classifier.categories.findIndex((c) => c.id === categoryId);

    if (categoryIndex === -1) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    classifier.categories.splice(categoryIndex, 1);

    // Reset records that were assigned to this category
    for (const record of classifier.history) {
      if (record.categoryId === categoryId) {
        record.categoryId = null;
        delete record.feedback;
        delete record.correctedCategoryId;
      }
      if (record.correctedCategoryId === categoryId) {
        delete record.correctedCategoryId;
      }
    }

    await saveClassifier(classifier);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
