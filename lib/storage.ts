import { cache } from "react";
import fs from "fs/promises";
import path from "path";
import "server-only";
import type { Classifier } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const CLASSIFIERS_FILE = path.join(DATA_DIR, "classifiers.json");

interface ClassifiersData {
  classifiers: Classifier[];
}

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

async function ensureClassifiersFile() {
  await ensureDataDir();
  try {
    await fs.access(CLASSIFIERS_FILE);
  } catch {
    await fs.writeFile(CLASSIFIERS_FILE, JSON.stringify({ classifiers: [] }, null, 2));
  }
}

export const getAllClassifiers = cache(async (): Promise<Classifier[]> => {
  await ensureClassifiersFile();
  const content = await fs.readFile(CLASSIFIERS_FILE, "utf-8");
  const data: ClassifiersData = JSON.parse(content);
  return data.classifiers;
});

export const getClassifier = cache(async (id: string): Promise<Classifier | null> => {
  const classifiers = await getAllClassifiers();
  return classifiers.find((c) => c.id === id) || null;
});

export async function saveClassifier(classifier: Classifier): Promise<void> {
  const classifiers = await getAllClassifiers();
  const index = classifiers.findIndex((c) => c.id === classifier.id);

  if (index >= 0) {
    classifiers[index] = classifier;
  } else {
    classifiers.push(classifier);
  }

  await fs.writeFile(CLASSIFIERS_FILE, JSON.stringify({ classifiers }, null, 2));
}

export async function deleteClassifier(id: string): Promise<boolean> {
  const classifiers = await getAllClassifiers();
  const filtered = classifiers.filter((c) => c.id !== id);

  if (filtered.length === classifiers.length) {
    return false;
  }

  await fs.writeFile(CLASSIFIERS_FILE, JSON.stringify({ classifiers: filtered }, null, 2));
  return true;
}
