import { AdminShell } from "@/components/brand/admin-shell";
import { ArticlesTable } from "@/components/admin/articles-table";
import { getArticles } from "@/lib/api";
import { getAdminUser } from "@/lib/admin-auth";

export default async function AdminArticlesPage() {
  const [articles, user] = await Promise.all([
    getArticles(true),
    getAdminUser(),
  ]);

  return (
    <AdminShell user={user}>
      <ArticlesTable articles={articles} user={user} />
    </AdminShell>
  );
}
