import { FormEvent, useState } from "react";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { useCompany } from "./useCompany";

export function ContactPage() {
  const { data: company } = useCompany();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // No server-side contact inbox exists, so we hand off to the visitor's mail
    // client with everything pre-filled — a genuinely working "send", not a fake.
    const to = company?.email ?? "info@vcarrent.al";
    const subject = encodeURIComponent(`Website enquiry from ${form.name || "a visitor"}`);
    const body = encodeURIComponent(`${form.message}\n\nFrom: ${form.name}\nEmail: ${form.email}`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  const contactCards = [
    { icon: Phone, label: "Call us", value: company?.phone, href: company?.phone ? `tel:${company.phone}` : undefined },
    { icon: Mail, label: "Email us", value: company?.email, href: company?.email ? `mailto:${company.email}` : undefined },
    { icon: MapPin, label: "Visit us", value: company?.address },
    { icon: Clock, label: "Opening hours", value: "Mon–Sat, 8:00 – 20:00" },
  ];

  return (
    <div>
      <section className="border-b border-slate-100 bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <span className="badge bg-brand-50 text-brand-700">Contact</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Get in touch</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-500">
            Questions about a booking, our fleet or long-term rentals? We're happy to help.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Contact details */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {contactCards.map((c) => (
              <div key={c.label} className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <c.icon size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{c.label}</p>
                  {c.href ? (
                    <a href={c.href} className="mt-0.5 block text-sm text-brand-600 hover:underline">
                      {c.value ?? "—"}
                    </a>
                  ) : (
                    <p className="mt-0.5 text-sm text-slate-500">{c.value ?? "—"}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Message form */}
          <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-card">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <Send className="text-brand-500" size={40} />
                <h2 className="mt-4 text-xl font-bold text-slate-900">Your email is ready to send</h2>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  We opened your email app with the message pre-filled. If nothing happened, reach us directly at{" "}
                  <a href={`mailto:${company?.email ?? "info@vcarrent.al"}`} className="font-medium text-brand-600">
                    {company?.email ?? "info@vcarrent.al"}
                  </a>
                  .
                </p>
                <button type="button" className="btn-secondary mt-6" onClick={() => setSent(false)}>
                  Write another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Send us a message</h2>
                <div>
                  <label className="label">Your name</label>
                  <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea
                    className="input min-h-[140px] resize-y"
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="How can we help?"
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-3">
                  <Send size={16} /> Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
