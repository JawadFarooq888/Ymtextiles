"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/features/admin/uploads/upload-image";
import { cloudinaryUrl } from "@/lib/image";

interface ImageUploadFieldProps {
  id: string;
  value: string;
  onChange: (url: string) => void;
  folder: "categories" | "banners";
}

/** Single image upload (categories, banners). Stores the Cloudinary URL. */
export function ImageUploadField({ id, value, onChange, folder }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadImage(file, folder);
      onChange(uploaded.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <div className="relative size-20 overflow-hidden rounded-lg border bg-muted">
          <Image
            src={cloudinaryUrl(value, 200)}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
      ) : null}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2Icon className="animate-spin" /> : <ImagePlusIcon />}
        {value ? "Replace image" : "Upload image"}
      </Button>
      {value ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
          <XIcon /> Remove
        </Button>
      ) : null}
    </div>
  );
}
