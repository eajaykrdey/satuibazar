import { ArrowRight } from 'lucide-react';
import { HERO_SHOWCASE_ASSET } from '../data/assetMap';
import { ProductImage } from './ProductImage';

interface HeroBannerProps {
  onShopNow: () => void;
  onExploreDeals: () => void;
}

export function HeroBanner({ onShopNow, onExploreDeals }: HeroBannerProps) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8"
    >
      <div className="grid grid-cols-1 items-stretch overflow-hidden rounded-2xl border border-emerald-950/15 bg-[#052E24] text-white lg:grid-cols-12">
        {/* Left Editorial Campaign Column */}
        <div className="flex flex-col justify-between p-6 sm:p-10 lg:col-span-6 lg:p-12">
          <div className="space-y-5">
            <p className="text-xs font-medium tracking-wide text-emerald-200/90">
              Autumn Storefront · Up to 32% Daily Savings
            </p>

            <h1
              id="hero-heading"
              className="max-w-xl font-display text-[clamp(2.1rem,3.8vw,3.4rem)] font-bold leading-[1.08] tracking-tight text-white [text-wrap:balance]"
            >
              Thoughtful essentials, studio electronics, and Bengal handloom.
            </h1>

            <p className="max-w-lg text-base leading-relaxed text-emerald-100/85">
              From acoustic wireless audio and tactile desk hardware to heritage Murshidabad textiles and cast-iron kitchenware—curated directly for everyday living.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onShopNow}
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onExploreDeals}
                className="inline-flex h-12 items-center rounded-lg border border-emerald-200/25 px-5 py-3 text-sm font-medium text-emerald-100 transition-colors duration-150 hover:border-emerald-200/50 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Explore Daily Deals
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-white/10 pt-5 text-xs text-emerald-200/80">
              <span>Free Standard Delivery ₹1,999+</span>
              <span aria-hidden="true">·</span>
              <span>Cash on Delivery &amp; UPI</span>
              <span aria-hidden="true">·</span>
              <span>7-Day Easy Replacement</span>
            </div>
          </div>
        </div>

        {/* Right Full-Bleed Campaign Photograph */}
        <div className="min-h-[260px] sm:min-h-[340px] lg:col-span-6 lg:min-h-full">
          <ProductImage
            src={HERO_SHOWCASE_ASSET}
            alt="Curated wireless headphones, brushed brass desk lamp, cognac leather messenger bag, and ceramic homeware on warm travertine stone"
            containerClassName="h-full w-full"
            className="lg:h-full"
          />
        </div>
      </div>
    </section>
  );
}
