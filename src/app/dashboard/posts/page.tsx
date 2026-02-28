import PostList from "@/components/posts/PostList";

export default function PostsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">投稿履歴</h1>
      <PostList />
    </div>
  );
}
