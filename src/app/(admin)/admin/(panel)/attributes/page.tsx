import type { Metadata } from "next";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { PageHeader } from "@/features/admin/components/page-header";
import {
  ColourDialog,
  DeleteColourButton,
  DeleteSizeButton,
  SizeDialog,
} from "@/features/admin/attributes/attribute-dialogs";
import { listColours, listSizes } from "@/features/admin/attributes/service";

export const metadata: Metadata = { title: "Sizes & colours" };
export const dynamic = "force-dynamic";

export default async function AttributesPage() {
  const [sizes, colours] = await Promise.all([listSizes(), listColours()]);

  return (
    <>
      <PageHeader
        title="Sizes & washes"
        description="Used to build product variants. Items in use by variants cannot be deleted."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sizes</CardTitle>
            <CardAction>
              <SizeDialog
                trigger={
                  <Button size="sm">
                    <PlusIcon /> Add size
                  </Button>
                }
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {sizes.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2">
                  <span className="w-28 font-medium text-brand-ink">{s.label}</span>
                  <span className="flex-1 text-xs text-muted-foreground">
                    Order {s.sortOrder} · {s._count.variants} variant(s)
                  </span>
                  <SizeDialog
                    initial={{
                      id: s.id,
                      label: s.label,
                      waist: s.waist?.toString() ?? "",
                      length: s.length?.toString() ?? "",
                      sortOrder: String(s.sortOrder),
                    }}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label={`Edit size ${s.label}`}>
                        <PencilIcon />
                      </Button>
                    }
                  />
                  <DeleteSizeButton id={s.id} label={s.label} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Colours</CardTitle>
            <CardAction>
              <ColourDialog
                trigger={
                  <Button size="sm">
                    <PlusIcon /> Add colour
                  </Button>
                }
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {colours.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2">
                  <span
                    className="size-6 shrink-0 rounded-full border"
                    style={{ backgroundColor: c.hex }}
                    aria-hidden
                  />
                  <span className="w-24 font-medium text-brand-ink">{c.name}</span>
                  <span className="flex-1 text-xs text-muted-foreground">
                    {c.hex} · {c._count.variants} variant(s)
                  </span>
                  <ColourDialog
                    initial={{ id: c.id, name: c.name, hex: c.hex }}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label={`Edit colour ${c.name}`}>
                        <PencilIcon />
                      </Button>
                    }
                  />
                  <DeleteColourButton id={c.id} name={c.name} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
