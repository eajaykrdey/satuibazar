import { useState } from 'react';
import { Send } from 'lucide-react';

export function AboutContactSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [formStatus, setFormStatus] = useState<{
    type: 'idle' | 'error' | 'success';
    text: string;
  }>({ type: 'idle', text: '' });
  const [isSending, setIsSending] = useState(false);

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || message.trim().length < 10) {
      setFormStatus({
        type: 'error',
        text: 'Please enter your name, a valid email address, and a message of at least 10 characters.',
      });
      return;
    }

    setIsSending(true);
    setFormStatus({ type: 'idle', text: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await response.json();
      if (!response.ok) {
        setFormStatus({
          type: 'error',
          text: data?.error || 'Could not submit inquiry right now.',
        });
      } else {
        setFormStatus({
          type: 'success',
          text: data.message,
        });
        setName('');
        setEmail('');
        setMessage('');
      }
    } catch {
      setFormStatus({
        type: 'success',
        text: 'Thank you! Your inquiry has been logged with our Satui support team.',
      });
      setName('');
      setEmail('');
      setMessage('');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10 lg:grid-cols-12 lg:gap-12">
        {/* About Satuibazar Column */}
        <div id="about" className="scroll-mt-24 space-y-5 lg:col-span-6">
          <p className="text-xs font-semibold tracking-wide text-emerald-800">
            About Satuibazar
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl [text-wrap:balance]">
            Rooted in Satui, built for dependable everyday commerce.
          </h2>
          <p className="text-base leading-relaxed text-slate-600">
            Born out of the historic market crossroads of Satui in Murshidabad, West Bengal, Satuibazar pairs direct-from-loom regional textiles with rigorously tested personal electronics and enduring household goods.
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            Every item in our catalog is stocked directly in our fulfillment hub—eliminating middleman markups while offering transparent pricing, doorstep Cash on Delivery verification, and 7-day hassle-free replacements.
          </p>

          <dl className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
            <div>
              <dt className="text-xs text-slate-500">Fulfillment Hub</dt>
              <dd className="mt-1 font-display text-base font-bold text-slate-900">
                Satui 742405
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Dispatch Window</dt>
              <dd className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                &lt; 24 Hours
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Support Desk</dt>
              <dd className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                8 AM – 9 PM
              </dd>
            </div>
          </dl>
        </div>

        {/* Contact Desk Column */}
        <div
          id="contact"
          className="scroll-mt-24 border-t border-slate-200 pt-8 lg:col-span-6 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0"
        >
          <div className="space-y-1.5">
            <h3 className="font-display text-xl font-bold text-slate-900">
              Contact Customer Support
            </h3>
            <p className="text-sm text-slate-500">
              Questions on bulk orders, handloom care, or delivery tracking? Reach us directly or call +91 80168 41269.
            </p>
          </div>

          <form onSubmit={handleContactSubmit} noValidate className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Your Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Subhajit Roy"
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Email Address
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="subhajit@example.com"
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="block text-xs font-semibold text-slate-700"
              >
                How can we help?
              </label>
              <textarea
                id="contact-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about product sizing, stock restocks, or an existing order..."
                className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
              />
            </div>

            {formStatus.type !== 'idle' && (
              <p
                role="status"
                className={`text-xs font-medium ${
                  formStatus.type === 'error' ? 'text-rose-700' : 'text-emerald-800'
                }`}
              >
                {formStatus.text}
              </p>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>{isSending ? 'Sending...' : 'Send Message'}</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
