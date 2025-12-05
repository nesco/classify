import { getAllClassifiers } from "@/lib/storage";
import { ClassifierList } from "@/components/classifier-list";

export default async function Home() {
  const classifiers = await getAllClassifiers();

  return <ClassifierList initialClassifiers={classifiers} />;
}
