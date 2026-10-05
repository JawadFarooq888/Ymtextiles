import type { Metadata } from "next";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/features/admin/components/page-header";
import { CategoryFormDialog } from "@/features/admin/categories/category-form-dialog";
import { CategoryDeleteButton } from "@/features/admin/categories/category-delete-button";
import { listCategoriesForAdmin, listCategoryOptions } from "@/features/admin/categories/service";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [categories, options] = await Promise.all([
    listCategoriesForAdmin(),
    listCategoryOptions(),
  ]);

  // Order as a tree: each parent followed by its children.
  type Row = (typeof categories)[number] & { depth: number };
  const rows: Row[] = [];
  const visit = (parentId: string | null, depth: number) => {
    for (const c of categories.filter((x) => x.parentId === parentId)) {
      rows.push({ ...c, depth });
      visit(c.id, depth + 1);
    }
  };
  visit(null, 0);

  return (
    <>
      <PageHeader
        title="Categories"
        description="Shown in the shop menu. Sub-categories appear under their parent."
        actions={
          <CategoryFormDialog
            parentOptions={options}
            trigger={
              <Button>
                <PlusIcon /> New category
              </Button>
            }
          />
        }
      />
      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Slug</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell style={{ paddingLeft: `${0.5 + c.depth * 1.5}rem` }}>
                  {c.depth > 0 ? <span className="mr-1 text-muted-foreground">↳</span> : null}
                  <span className="font-medium text-brand-ink">{c.name}</span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {c.slug}
                </TableCell>
                <TableCell>{c._count.products}</TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? "secondary" : "outline"}>
                    {c.isActive ? "Visible" : "Hidden"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <CategoryFormDialog
                      parentOptions={options}
                      initial={{
                        id: c.id,
                        name: c.name,
                        slug: c.slug,
                        parentId: c.parentId ?? "",
                        description: c.description ?? "",
                        image: c.image ?? "",
                        sortOrder: String(c.sortOrder),
                        isActive: c.isActive,
                      }}
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${c.name}`}>
                          <PencilIcon />
                        </Button>
                      }
                    />
                    <CategoryDeleteButton id={c.id} name={c.name} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
