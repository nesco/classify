import { getClassifier } from "@/lib/storage";
import { ClassifierDetail } from "@/components/classifier-detail";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassifierPage({ params }: PageProps) {
  const { id } = await params;
  const classifier = await getClassifier(id);

  if (!classifier) {
    notFound();
  }

  return <ClassifierDetail initialClassifier={classifier} />;
}
