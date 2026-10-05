"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useFieldArray, type Control, type UseFormRegister } from "react-hook-form";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImage } from "@/features/admin/uploads/upload-image";
import type { ProductData, ProductFormValues } from "@/features/admin/products/schema";
import { cloudinaryUrl } from "@/lib/image";

interface Props {
  control: Control<ProductFormValues, unknown, ProductData>;
  register: UseFormRegister<ProductFormValues>;
  colours: { id: string; name: string }[];
  productName: string;
}

export function ProductImagesField({ control, register, colours, productName }: Props) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "images",
    keyName: "fieldKey",
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploading((n) => n + list.length);
    // Upload in parallel but append in the order the files were chosen.
    const results = await Promise.allSettled(list.map((f) => uploadImage(f, "products")));
    results.forEach((r) => {
      if (r.status === "fulfilled") {
        append({ url: r.value.url, publicId: r.value.publicId, alt: productName, colourId: "" });
      } else {
        toast.error(r.reason instanceof Error ? r.reason.message : "Upload failed");
      }
    });
    setUploading((n) => n - list.length);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((f) => f.fieldKey === active.id);
    const to = fields.findIndex((f) => f.fieldKey === over.id);
    if (from >= 0 && to >= 0) move(from, to);
  }

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        The first image is the main photo. Drag to reorder. Optionally link an image to a colour so
        the gallery switches when a customer picks that colour.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={fields.map((f) => f.fieldKey)} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {fields.map((field, index) => (
              <SortableImage
                key={field.fieldKey}
                id={field.fieldKey}
                url={field.url}
                index={index}
                onRemove={() => remove(index)}
              >
                <Input
                  aria-label={`Image ${index + 1} alt text`}
                  placeholder="Describe the photo"
                  className="h-8 text-xs"
                  {...register(`images.${index}.alt`)}
                />
                <select
                  aria-label={`Image ${index + 1} colour`}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs"
                  {...register(`images.${index}.colourId`)}
                >
                  <option value="">All colours</option>
                  {colours.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </SortableImage>
            ))}
            {Array.from({ length: uploading }).map((_, i) => (
              <li
                key={`uploading-${i}`}
                className="flex aspect-[3/4] items-center justify-center rounded-xl border bg-muted"
              >
                <Loader2Icon
                  className="animate-spin text-muted-foreground"
                  aria-label="Uploading"
                />
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        id="product-images-input"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div>
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <ImagePlusIcon /> Upload images
        </Button>
      </div>
    </div>
  );
}

function SortableImage({
  id,
  url,
  index,
  onRemove,
  children,
}: {
  id: string;
  url: string;
  index: number;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`grid gap-2 rounded-xl border bg-card p-2 ${isDragging ? "z-10 shadow-lg" : ""}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        <Image src={cloudinaryUrl(url, 400)} alt="" fill sizes="200px" className="object-cover" />
        {index === 0 ? (
          <span className="absolute top-1 left-1 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
            Main
          </span>
        ) : null}
        <div className="absolute top-1 right-1 flex gap-1">
          <button
            type="button"
            className="flex size-7 cursor-grab items-center justify-center rounded-full bg-background/90"
            aria-label={`Drag image ${index + 1}`}
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon className="size-4" />
          </button>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-full bg-background/90 text-destructive"
            aria-label={`Remove image ${index + 1}`}
            onClick={onRemove}
          >
            <XIcon className="size-4" />
          </button>
        </div>
      </div>
      {children}
    </li>
  );
}
