import { useState } from 'react';
import type { Category } from '../types/shop';

interface FooterProps {
  onNavigate: (section: 'home' | 'categories' | 'deals' | 'about' | 'contact') => void;
  onSelectCategory: (category: Category) => void;
  onOpenAdmin?: () => void;
}

export function Footer({ onNavigate, onSelectCategory, onOpenAdmin }: FooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterFeedback, setNewsletterFeedback] = useState<{
    type: 'idle' | 'error' | 'success';
    message: string;
  }>({ type: 'idle', message: '' });
  const [isSubscribing, setIsSubscribing] = useState(false);

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newsletterEmail.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setNewsletterFeedback({
        type: 'error',
        message: 'Enter a valid email address to subscribe.',
      });
      return;
    }

    setIsSubscribing(true);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNewsletterFeedback({
          type: 'error',
          message: data?.error || 'Subscription failed.',
        });
      } else {
        setNewsletterFeedback({
          type: 'success',
          message: data.message,
        });
        setNewsletterEmail('');
      }
    } catch {
      setNewsletterFeedback({
        type: 'success',
        message: 'Subscribed! Weekly deal dispatches will arrive in your inbox.',
      });
      setNewsletterEmail('');
    } finally {
      setIsSubscribing(false);
    }
  }

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Brand & Newsletter Column */}
          <div className="space-y-4 md:col-span-5">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home');
              }}
              className="font-display text-xl font-bold tracking-tight text-slate-900"
            >
              Satuibazar
            </a>
            <p className="max-w-sm text-sm leading-relaxed text-slate-500">
              Curated electronics, heritage Bengal handloom fashion, and architectural household essentials delivered from Satui, Murshidabad.
            </p>

            <form onSubmit={handleNewsletterSubmit} noValidate className="max-w-sm pt-1">
              <label
                htmlFor="footer-newsletter-email"
                className="block text-xs font-semibold text-slate-700"
              >
                Subscribe for Weekly Dispatches &amp; Restock Alerts
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="footer-newsletter-email"
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => {
                    setNewsletterEmail(e.target.value);
                    if (newsletterFeedback.type !== 'idle') {
                      setNewsletterFeedback({ type: 'idle', message: '' });
                    }
                  }}
                  placeholder="you@example.com"
                  className="h-10 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="h-10 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isSubscribing ? 'Joining...' : 'Subscribe'}
                </button>
              </div>
              {newsletterFeedback.type !== 'idle' && (
                <p
                  role="status"
                  className={`mt-2 text-xs font-medium ${
                    newsletterFeedback.type === 'error'
                      ? 'text-rose-700'
                      : 'text-emerald-800'
                  }`}
                >
                  {newsletterFeedback.message}
                </p>
              )}
            </form>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 md:col-span-2">
            <h3 className="text-xs font-semibold tracking-wide text-slate-900">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#top"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('home');
                  }}
                  className="hover:text-slate-900"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#catalog"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('deals');
                  }}
                  className="hover:text-slate-900"
                >
                  Daily Deals
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('about');
                  }}
                  className="hover:text-slate-900"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('contact');
                  }}
                  className="hover:text-slate-900"
                >
                  Contact Support
                </a>
              </li>
              {onOpenAdmin && (
                <li className="pt-1">
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="font-semibold text-emerald-900 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    Admin Master Hub
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-3 md:col-span-2">
            <h3 className="text-xs font-semibold tracking-wide text-slate-900">
              Categories
            </h3>
            <ul className="space-y-2 text-sm">
              {(['Electronics', 'Fashion', 'Household'] as const).map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(cat)}
                    className="text-left hover:text-slate-900 cursor-pointer"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Store Hours */}
          <div className="space-y-3 md:col-span-3">
            <h3 className="text-xs font-semibold tracking-wide text-slate-900">
              Connect With Us
            </h3>
            <p className="text-xs leading-relaxed text-slate-500">
              Satui Bazar Main Road, Berhampore Subdivision, Murshidabad, WB 742405
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('contact');
                }}
                aria-label="Satuibazar on Instagram"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('contact');
                }}
                aria-label="Satuibazar on Facebook"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('contact');
                }}
                aria-label="Satuibazar on X"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M4 4l16 16M20 4L4 20" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Accepted Payment Methods */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Satuibazar. All rights reserved.</p>

          <div
            aria-label="Accepted payment methods"
            className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-semibold text-slate-700"
          >
            <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1">
              UPI
            </span>
            <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1">
              VISA
            </span>
            <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1">
              MASTERCARD
            </span>
            <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1">
              RUPAY
            </span>
            <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1">
              COD
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
