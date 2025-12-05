"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import type { Classifier } from "@/lib/types";

interface ClassifierListProps {
  initialClassifiers: Classifier[];
}

export function ClassifierList({ initialClassifiers }: ClassifierListProps) {
  const [classifiers, setClassifiers] = useState<Classifier[]>(initialClassifiers);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  async function handleCreate() {
    if (!newName.trim()) return;

    try {
      const res = await fetch("/api/classifiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDescription }),
      });

      if (res.ok) {
        const newClassifier = await res.json();
        setClassifiers([...classifiers, newClassifier]);
        setIsCreateDialogOpen(false);
        setNewName("");
        setNewDescription("");
        toast.success("Classifier created!");
      } else {
        toast.error("Failed to create classifier");
      }
    } catch (error) {
      console.error("Failed to create classifier:", error);
      toast.error("Failed to create classifier");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Allobrain Classifier</h1>
          <p className="text-sm text-muted-foreground">
            Configurable text classification powered by LLM
          </p>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Classifiers</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage your text classifiers
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Classifier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Classifier</DialogTitle>
                <DialogDescription>
                  Give your classifier a name and description.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Email Triage"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What will you classify with this?"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!newName.trim()}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {classifiers.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto max-w-md space-y-4">
              <h3 className="text-lg font-semibold">No classifiers yet</h3>
              <p className="text-sm text-muted-foreground">
                Create your first classifier to start categorizing text with AI
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Classifier
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classifiers.map((classifier) => (
              <Link key={classifier.id} href={`/classifier/${classifier.id}`}>
                <Card className="p-6 transition-colors hover:bg-accent">
                  <h3 className="mb-2 font-semibold">{classifier.name}</h3>
                  {classifier.description && (
                    <p className="mb-4 text-sm text-muted-foreground">
                      {classifier.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{classifier.categories.length} categories</span>
                    <span>{classifier.history.length} classifications</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
