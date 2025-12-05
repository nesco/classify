"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  ChevronLeft,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import type { Classifier, Category } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/constants";

interface ClassifierDetailProps {
  initialClassifier: Classifier;
}

export function ClassifierDetail({ initialClassifier }: ClassifierDetailProps) {
  const router = useRouter();
  const [classifier, setClassifier] = useState<Classifier>(initialClassifier);
  const [isPending, startTransition] = useTransition();
  const [classifyText, setClassifyText] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryExamples, setCategoryExamples] = useState<string[]>([]);
  const [newExample, setNewExample] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);

  async function refreshClassifier() {
    const res = await fetch(`/api/classifiers/${classifier.id}`);
    if (res.ok) {
      const data = await res.json();
      setClassifier(data);
    }
  }

  async function handleClassify() {
    if (!classifyText.trim() || classifier.categories.length === 0) return;

    setIsClassifying(true);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classifierId: classifier.id,
          text: classifyText,
        }),
      });

      if (res.ok) {
        startTransition(async () => {
          await refreshClassifier();
          setClassifyText("");
          toast.success("Text classified successfully!");
        });
      } else {
        toast.error("Classification failed");
      }
    } catch (error) {
      console.error("Classification failed:", error);
      toast.error("Classification failed");
    } finally {
      setIsClassifying(false);
    }
  }

  function openCategoryDialog(category?: Category, initialExamples?: string[]) {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
      setCategoryDescription(category.description);
      setCategoryExamples([...category.examples]);
    } else {
      setEditingCategory(null);
      setCategoryName("");
      setCategoryDescription("");
      setCategoryExamples(initialExamples ?? []);
    }
    setNewExample("");
    setIsCategoryDialogOpen(true);
  }

  function toggleRecordSelection(recordId: string) {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecords(newSelected);
  }

  async function createCategoryFromSelected() {
    const selectedTexts = classifier.history
      .filter((r) => selectedRecords.has(r.id))
      .map((r) => r.text);

    setIsSuggestingCategory(true);
    setSelectedRecords(new Set());

    try {
      const res = await fetch("/api/suggest-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examples: selectedTexts,
          existingCategories: classifier.categories,
        }),
      });

      if (res.ok) {
        const suggestion = await res.json();
        setEditingCategory(null);
        setCategoryName(suggestion.name);
        setCategoryDescription(suggestion.description);
        setCategoryExamples(selectedTexts);
        setNewExample("");
        setIsCategoryDialogOpen(true);
      } else {
        openCategoryDialog(undefined, selectedTexts);
        toast.error("Could not generate suggestion, please fill manually");
      }
    } catch {
      openCategoryDialog(undefined, selectedTexts);
      toast.error("Could not generate suggestion, please fill manually");
    } finally {
      setIsSuggestingCategory(false);
    }
  }


  function addExample() {
    if (newExample.trim()) {
      setCategoryExamples([...categoryExamples, newExample.trim()]);
      setNewExample("");
    }
  }

  function removeExample(index: number) {
    setCategoryExamples(categoryExamples.filter((_, i) => i !== index));
  }

  async function handleSaveCategory() {
    if (!categoryName.trim() || !categoryDescription.trim()) return;

    const colorIndex = editingCategory
      ? classifier.categories.findIndex((c) => c.id === editingCategory.id)
      : classifier.categories.length;
    const color = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];

    const categoryData = {
      name: categoryName,
      description: categoryDescription,
      examples: categoryExamples,
      color,
      ...(editingCategory && { id: editingCategory.id }),
    };

    try {
      const res = await fetch(`/api/classifiers/${classifier.id}/categories`, {
        method: editingCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });

      if (res.ok) {
        startTransition(async () => {
          await refreshClassifier();
          setIsCategoryDialogOpen(false);
          toast.success(editingCategory ? "Category updated!" : "Category created!");
        });
      } else {
        toast.error("Failed to save category");
      }
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error("Failed to save category");
    }
  }

  async function handleDeleteCategory() {
    if (!editingCategory) return;

    try {
      const res = await fetch(
        `/api/classifiers/${classifier.id}/categories?categoryId=${editingCategory.id}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        startTransition(async () => {
          await refreshClassifier();
          setIsCategoryDialogOpen(false);
          toast.success("Category deleted!");
        });
      } else {
        toast.error("Failed to delete category");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("Failed to delete category");
    }
  }

  async function handleDeleteClassifier() {
    try {
      const res = await fetch(`/api/classifiers/${classifier.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Classifier deleted!");
        router.push("/");
      } else {
        toast.error("Failed to delete classifier");
      }
    } catch (error) {
      console.error("Failed to delete classifier:", error);
      toast.error("Failed to delete classifier");
    }
  }

  async function handleFeedback(recordId: string, correct: boolean, correctedCategoryId?: string) {
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classifierId: classifier.id,
          historyId: recordId,
          feedback: correct ? "correct" : "incorrect",
          correctedCategoryId,
        }),
      });

      if (res.ok) {
        startTransition(async () => {
          await refreshClassifier();
          toast.success(
            correct ? "Feedback recorded!" : "Correction recorded - AI will learn from this!"
          );
        });
      } else {
        toast.error("Failed to submit feedback");
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback");
    }
  }

  function toggleExpanded(recordId: string) {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRecords(newExpanded);
  }

  function getCategoryById(id: string | null): Category | undefined {
    return classifier.categories.find((c) => c.id === id);
  }

  function getConfidenceBadgeVariant(confidence: string) {
    if (confidence === "high") return "default";
    if (confidence === "medium") return "secondary";
    return "outline";
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">{classifier.name}</h1>
              {classifier.description && (
                <p className="text-sm text-muted-foreground">{classifier.description}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* 2-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center Column - Classify & History */}
        <div className="flex flex-1 flex-col border-r">
          {/* Classification Input */}
          <div className="border-b p-6">
            <Textarea
              placeholder="Enter text to classify..."
              value={classifyText}
              onChange={(e) => setClassifyText(e.target.value)}
              className="mb-4 min-h-[120px] resize-none"
              disabled={isClassifying}
            />
            <Button
              onClick={handleClassify}
              disabled={!classifyText.trim() || isClassifying || classifier.categories.length === 0}
              className="w-full"
            >
              {isClassifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Classifying...
                </>
              ) : (
                "Classify"
              )}
            </Button>
            {classifier.categories.length === 0 && (
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Add categories to start classifying
              </p>
            )}
          </div>

          {/* History */}
          <div className="relative flex-1 overflow-hidden">
            <div className="border-b bg-muted/30 px-6 py-3">
              <h3 className="font-semibold">Classification History</h3>
            </div>
            <ScrollArea className="h-full">
              <div className="space-y-4 p-6">
                {classifier.history.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No classifications yet. Enter text above to get started.
                  </div>
                ) : (
                  classifier.history
                    .slice()
                    .reverse()
                    .map((record) => {
                      const category = getCategoryById(record.categoryId);
                      const isExpanded = expandedRecords.has(record.id);
                      const truncatedText =
                        record.text.length > 100 ? record.text.slice(0, 100) + "..." : record.text;
                      const isSelectable = record.categoryId === null && !record.feedback;
                      const isSelected = selectedRecords.has(record.id);

                      return (
                        <Card
                          key={record.id}
                          className={`overflow-hidden ${isSelected ? "ring-2 ring-primary" : ""}`}
                        >
                          <div className="flex">
                            {isSelectable && (
                              <div
                                className="flex w-10 shrink-0 cursor-pointer items-center justify-center border-r hover:bg-muted/50"
                                onClick={() => toggleRecordSelection(record.id)}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleRecordSelection(record.id)}
                                />
                              </div>
                            )}
                            <div className="flex-1 p-4">
                              <div
                                className="cursor-pointer"
                                onClick={() => toggleExpanded(record.id)}
                              >
                                <div className="mb-2 flex items-start justify-between gap-2">
                                  <p className="flex-1 text-sm">
                                    {isExpanded ? record.text : truncatedText}
                                  </p>
                                  {record.text.length > 100 && (
                                    <Button variant="ghost" size="sm" className="h-6 px-2">
                                      {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="mb-2 flex items-center gap-2">
                                {category && (
                                  <Badge
                                    style={{ backgroundColor: category.color }}
                                    className="text-white"
                                  >
                                    {category.name}
                                  </Badge>
                                )}
                                <Badge variant={getConfidenceBadgeVariant(record.confidence)}>
                                  {record.confidence}
                                </Badge>
                              </div>

                              {isExpanded && record.explanation && (
                                <p className="mb-3 text-xs text-muted-foreground">
                                  {record.explanation}
                                </p>
                              )}

                              {record.feedback === "correct" ? (
                                <div className="flex items-center gap-1 text-xs text-green-600">
                                  <Check className="h-3 w-3" />
                                  Confirmed
                                </div>
                              ) : record.feedback === "incorrect" ? (
                                <div className="text-xs text-orange-600">
                                  Assigned to {getCategoryById(record.correctedCategoryId || "")?.name}
                                </div>
                              ) : record.categoryId === null ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs"
                                      disabled={isPending}
                                    >
                                      <Plus className="mr-1 h-3 w-3" />
                                      Assign to category
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48 p-2">
                                    <p className="mb-2 text-xs font-medium">Select category:</p>
                                    <div className="space-y-1">
                                      {classifier.categories.map((c) => (
                                        <button
                                          key={c.id}
                                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                                          onClick={() => handleFeedback(record.id, false, c.id)}
                                        >
                                          <div
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: c.color }}
                                          />
                                          {c.name}
                                        </button>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    onClick={() => handleFeedback(record.id, true)}
                                    disabled={isPending}
                                  >
                                    <Check className="mr-1 h-3 w-3" />
                                    Correct
                                  </Button>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs"
                                        disabled={isPending}
                                      >
                                        <X className="mr-1 h-3 w-3" />
                                        Incorrect
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-2">
                                      <p className="mb-2 text-xs font-medium">Select correct category:</p>
                                      <div className="space-y-1">
                                        {classifier.categories
                                          .filter((c) => c.id !== record.categoryId)
                                          .map((c) => (
                                            <button
                                              key={c.id}
                                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                                              onClick={() => handleFeedback(record.id, false, c.id)}
                                            >
                                              <div
                                                className="h-2 w-2 rounded-full"
                                                style={{ backgroundColor: c.color }}
                                              />
                                              {c.name}
                                            </button>
                                          ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })
                )}
              </div>
            </ScrollArea>

            {(selectedRecords.size >= 1 || isSuggestingCategory) && (
              <div className="absolute inset-x-0 bottom-4 flex justify-center">
                <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-2 shadow-lg">
                  {isSuggestingCategory ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Generating suggestion...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground">
                        {selectedRecords.size} selected
                      </span>
                      <Button size="sm" onClick={createCategoryFromSelected}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create category
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedRecords(new Set())}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Categories */}
        <div className="w-80 flex-shrink-0">
          <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-3">
            <h3 className="font-semibold">Categories</h3>
            <Button size="sm" variant="ghost" onClick={() => openCategoryDialog()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-full">
            <div className="space-y-3 p-4">
              {classifier.categories.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="mb-4 text-sm text-muted-foreground">
                    Add categories to start classifying
                  </p>
                  <Button size="sm" onClick={() => openCategoryDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                </div>
              ) : (
                classifier.categories.map((category) => (
                  <Card
                    key={category.id}
                    className="cursor-pointer p-4 transition-colors hover:bg-accent"
                    onClick={() => openCategoryDialog(category)}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                      {category.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {category.examples.length} example{category.examples.length !== 1 ? "s" : ""}
                    </p>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              Define a category for classification. Be specific in the description to help the AI
              understand.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name *</Label>
              <Input
                id="category-name"
                placeholder="e.g., Urgent"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description *</Label>
              <Textarea
                id="category-description"
                placeholder="Describe what kind of text belongs in this category..."
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Examples (optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add example text..."
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addExample();
                    }
                  }}
                />
                <Button onClick={addExample} disabled={!newExample.trim()}>
                  Add
                </Button>
              </div>
              {categoryExamples.length > 0 && (
                <div className="space-y-1">
                  {categoryExamples.map((example, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded bg-muted px-3 py-2 text-sm"
                    >
                      <span className="flex-1">{example}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeExample(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            {editingCategory && (
              <Button variant="destructive" onClick={handleDeleteCategory} disabled={isPending}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveCategory}
                disabled={!categoryName.trim() || !categoryDescription.trim() || isPending}
              >
                {editingCategory ? "Save Changes" : "Create Category"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Classifier Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Classifier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{classifier.name}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClassifier}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
