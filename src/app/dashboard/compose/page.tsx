import PostComposer from "@/components/compose/PostComposer";
import { getTemplatesByDate } from "@/lib/templates";

export default function ComposePage() {
  const allDays = getTemplatesByDate();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">投稿作成</h1>
      <PostComposer allDays={allDays} />
    </div>
  );
}
