"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from "lucide-react";
import { cloudinaryUrl } from "@/lib/image";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
}

const INTERVAL_MS = 6000;

/** Accessible carousel: scroll-snap for swipe, auto-advance with a pause button, respects reduced motion. */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  const goTo = useCallback(
    (i: number) => {
      const track = trackRef.current;
      if (!track) return;
      const next = (i + slides.length) % slides.length;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    },
    [slides.length],
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing || slides.length < 2) return;
    const t = setInterval(() => goTo(index + 1), INTERVAL_MS);
    return () => clearInterval(t);
  }, [playing, index, goTo, slides.length]);

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  return (
    <section aria-roledescription="carousel" aria-label="Featured" className="relative">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => (
          <div
            key={s.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            className="relative h-[70vh] max-h-[640px] min-h-[420px] w-full shrink-0 snap-start"
          >
            {s.image ? (
              <Image
                src={cloudinaryUrl(s.image, 1920)}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#2c6a57,#1f4d3f_55%,#16332a)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-6 pb-16 text-white md:pb-20">
              <h2 className="max-w-2xl font-heading text-4xl leading-tight font-semibold text-white md:text-6xl">
                {s.title}
              </h2>
              {s.subtitle ? (
                <p className="mt-3 max-w-xl text-base text-white/90 md:text-lg">{s.subtitle}</p>
              ) : null}
              {s.ctaText && s.ctaUrl ? (
                <Link
                  href={s.ctaUrl}
                  tabIndex={i === index ? 0 : -1}
                  className="mt-6 inline-flex min-h-12 items-center rounded-full bg-brand-ivory px-8 text-sm font-medium tracking-wide text-primary uppercase hover:bg-white"
                >
                  {s.ctaText}
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 ? (
        <div className="absolute right-4 bottom-4 flex items-center gap-2 md:right-8">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause slideshow" : "Play slideshow"}
            className="flex size-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
          </button>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous slide"
            className="flex size-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <div className="flex gap-1.5" role="tablist" aria-label="Choose slide">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-2 rounded-full bg-white transition-all",
                  i === index ? "w-6" : "w-2 opacity-60",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next slide"
            className="flex size-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <ChevronRightIcon className="size-5" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
