import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/admin/article-editor";
import { AdminShell } from "@/components/brand/admin-shell";
import { getArticle, getProducts } from "@/lib/api";
import { getAdminUser } from "@/lib/admin-auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminArticleEditorPage({ params }: PageProps) {
  const { id } = await params;
  const [article, products, user] = await Promise.all([
    getArticle(id, true),
    getProducts(),
    getAdminUser(),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <AdminShell user={user}>
      <ArticleEditor article={article} products={products} />
    </AdminShell>
  );
}
