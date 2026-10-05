"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ZoomInIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ImagePlaceholder } from "@/features/catalog/components/image-placeholder";
import { cloudinaryUrl } from "@/lib/image";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  colourId: string | null;
}

/** Images for the chosen colour first (plus images not tied to a colour); all images otherwise. */
function imagesFor(images: GalleryImage[], colourId: string | null) {
  if (!colourId || !images.some((i) => i.colourId === colourId)) return images;
  return images.filter((i) => i.colourId === colourId || i.colourId === null);
}

export function ProductGallery({
  images,
  colourId,
  productName,
}: {
  images: GalleryImage[];
  colourId: string | null;
  productName: string;
}) {
  const shown = useMemo(() => imagesFor(images, colourId), [images, colourId]);
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Reset to the first photo when the colour changes the set of images.
  useEffect(() => {
    setActive(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [shown]);

  if (!shown.length) {
    return (
      <div className="aspect-[3/4] overflow-hidden rounded-2xl">
        <ImagePlaceholder label={productName} />
      </div>
    );
  }

  const select = (i: number) => {
    setActive(i);
    const track = trackRef.current;
    track?.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="grid gap-3 md:grid-cols-[72px_1fr] md:gap-4">
      {shown.length > 1 ? (
        <ul
          className="order-2 hidden gap-2 md:order-1 md:grid md:content-start"
          aria-label="Choose photo"
        >
          {shown.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => select(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative block aspect-[3/4] w-full overflow-hidden rounded-lg border-2",
                  i === active
                    ? "border-primary"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image
                  src={cloudinaryUrl(img.url, 160)}
                  alt=""
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative order-1 md:order-2">
        <div
          ref={trackRef}
          onScroll={(e) => {
            const t = e.currentTarget;
            setActive(Math.round(t.scrollLeft / t.clientWidth));
          }}
          className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto rounded-2xl [&::-webkit-scrollbar]:hidden"
        >
          {shown.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => {
                setActive(i);
                setZoomOpen(true);
              }}
              aria-label={`Zoom photo ${i + 1}`}
              className="relative aspect-[3/4] w-full shrink-0 cursor-zoom-in snap-start bg-secondary"
            >
              <Image
                src={cloudinaryUrl(img.url, 1000)}
                alt={img.alt || productName}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 45vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
        <span className="pointer-events-none absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-background/85 text-brand-ink">
          <ZoomInIcon className="size-4" aria-hidden />
        </span>
        {shown.length > 1 ? (
          <div
            className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden"
            aria-hidden
          >
            {shown.map((img, i) => (
              <span
                key={img.id}
                className={cn(
                  "h-1.5 rounded-full bg-white shadow transition-all",
                  i === active ? "w-5" : "w-1.5 opacity-70",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="h-[92vh] max-w-[96vw] p-0 sm:max-w-[96vw]">
          <DialogTitle className="sr-only">{productName}</DialogTitle>
          <DialogDescription className="sr-only">
            Zoomed photo. Scroll to see more detail.
          </DialogDescription>
          <div className="h-full overflow-auto rounded-lg">
            {shown[active] ? (
              // Plain img so the browser can show it at full resolution and the user can scroll around it.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cloudinaryUrl(shown[active].url, 2000)}
                alt={shown[active].alt || productName}
                className="mx-auto w-full max-w-[1600px]"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
