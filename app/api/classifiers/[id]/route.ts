import { NextResponse } from "next/server";
import { getClassifier, deleteClassifier } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const classifier = await getClassifier(id);

    if (!classifier) {
      return NextResponse.json({ error: "Classifier not found" }, { status: 404 });
    }

    return NextResponse.json(classifier);
  } catch (error) {
    console.error("Failed to get classifier:", error);
    return NextResponse.json({ error: "Failed to load classifier" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deleted = await deleteClassifier(id);

    if (!deleted) {
      return NextResponse.json({ error: "Classifier not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete classifier:", error);
    return NextResponse.json({ error: "Failed to delete classifier" }, { status: 500 });
  }
}
