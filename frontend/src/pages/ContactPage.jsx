import React, { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, Globe, Building2, Package, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/api";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { useAuth } from "../context/AuthContext";

const offices = [
  { city: "New York",  role: "Global HQ & Sales",      address: "350 Fifth Avenue, Suite 4200, New York, NY 10118", phone: "+1 (212) 555-1234",   email: "sales@globalleatherhub.com",   hours: "Mon–Fri  9 AM – 6 PM EST",     flag: "🇺🇸" },
  { city: "Lahore",    role: "Manufacturing Hub",       address: "Plot 47, Quaid-e-Azam Industrial Estate, Lahore", phone: "+92 42 3576 1234",    email: "factory@globalleatherhub.com", hours: "Mon–Sat  8 AM – 5 PM PKT",     flag: "🇵🇰" },
  { city: "London",    role: "Europe & Middle East",    address: "25 Old Broad Street, London EC2N 1HQ",             phone: "+44 20 7946 0851",    email: "europe@globalleatherhub.com",  hours: "Mon–Fri  9 AM – 5:30 PM GMT",  flag: "🇬🇧" },
];

const inquiryTypes = [
  "Wholesale Pricing Inquiry", "Custom / Private Label Order", "Sample Request",
  "Shipping & Logistics", "Returns & Quality Issue", "Partnership Opportunity", "Other",
];

const faqs = [
  { q: "What is the minimum order quantity (MOQ)?",    a: "Jackets: 50 units · Belts: 100 units · Wallets: 200 units. Custom/branded orders may differ." },
  { q: "How long does production take?",               a: "Standard 3–5 weeks. Rush production (2 weeks) available for orders under 500 units at added cost." },
  { q: "Do you offer private label / OEM services?",   a: "Yes — custom labels, packaging, and branding. Minimum 200 units per style for private label." },
  { q: "What payment methods do you accept?",          a: "Wire Transfer (T/T), Letter of Credit (LC), and business credit cards. 30–50% deposit required." },
  { q: "Can I request product samples first?",         a: "Yes, samples at cost + shipping. Fees refunded on qualifying bulk orders within 90 days." },
  { q: "Do you ship worldwide?",                       a: "We ship to 50+ countries via DHL, FedEx, and freight forwarders with full customs documentation." },
];

export default function ContactPage() {
  const { user } = useAuth();
  const [form, setForm]         = useState({ name: "", company: "", country: "", inquiryType: "", message: "" });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq]   = useState(null);

  useScrollReveal([openFaq]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name = "Name is required";
    if (!form.inquiryType)    e.inquiryType = "Please select an inquiry type";
    if (!form.message.trim()) e.message = "Message is required";
    else if (form.message.trim().length < 20) e.message = "Please provide more detail (min 20 chars)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!user) {
      toast.error("Please log in or sign up first to send a message.");
      return;
    }
    if (user.role === 'admin') {
      toast.error("Admin accounts cannot send inquiries to the company.");
      return;
    }
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/contact', { ...form, email: user.email });
      setSubmitted(true);
      toast.success("Message sent — we'll respond within 24 hours.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-canvas min-h-screen page-enter">

      {/* ── Hero with leather background ── */}
      <section className="relative pt-0 pb-0 min-h-[60vh] flex items-end overflow-hidden">
        <img
          src="/images/contact-hero.webp"
          alt="Leather workshop contact"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/60 to-canvas/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas/80 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pb-20 pt-36 w-full">
          <p className="eyebrow mb-4 animate-fade-up">Get in Touch</p>
          <h1
            className="text-espresso leading-[1.05] mb-5 animate-fade-up stagger-1"
            style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2.8rem, 7vw, 5rem)', fontWeight: 400 }}
          >
            Let's Talk
            <br />
            <em style={{ fontStyle: 'italic', color: '#8B5E3C' }}>Business.</em>
          </h1>
          <p className="text-fog font-light text-base max-w-xl leading-relaxed animate-fade-up stagger-2">
            Whether you're placing your first wholesale order or scaling an existing partnership,
            our team responds within 24 hours.
          </p>
        </div>
      </section>

      {/* ── Response time badges ── */}
      <section className="bg-espresso py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-wrap gap-6 items-center justify-center md:justify-between">
            {[
              { label: "Email Response", value: "< 24 hrs" },
              { label: "Phone Support",  value: "Mon–Fri 9–6" },
              { label: "Factory Tours",  value: "By Appointment" },
              { label: "Sample Delivery", value: "5–7 Business Days" },
            ].map(({ label, value }, i) => (
              <div key={label} className="text-center reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <p className="text-tan text-lg" style={{ fontFamily: '"Playfair Display", serif' }}>{value}</p>
                <p className="text-paper/40 text-[10px] tracking-widest uppercase">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Offices ── */}
      <section className="py-20 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-12 reveal">
          <p className="eyebrow mb-3">Global Offices</p>
          <h2 className="text-espresso" style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400 }}>
            Find Us <em style={{ fontStyle: 'italic', color: '#8B5E3C' }}>Worldwide</em>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {offices.map(({ city, role, address, phone, email, hours, flag }, i) => (
            <div key={city} className="card card-lift group reveal" style={{ transitionDelay: `${i * 0.12}s` }}>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-3xl group-hover:scale-110 transition-transform duration-300 inline-block">{flag}</span>
                <div>
                  <h3 className="text-espresso text-xl" style={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>{city}</h3>
                  <p className="text-tan text-[11px] tracking-wide font-medium">{role}</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: MapPin, text: address },
                  { icon: Phone,  text: phone,  href: `tel:${phone.replace(/\s/g, "")}` },
                  { icon: Mail,   text: email,  href: `mailto:${email}` },
                  { icon: Clock,  text: hours },
                ].map(({ icon: Icon, text, href }) => (
                  <div key={text} className="flex items-start gap-2.5 text-xs text-fog">
                    <Icon className="w-3.5 h-3.5 text-tan/70 mt-0.5 flex-shrink-0" />
                    {href
                      ? <a href={href} className="hover:text-espresso transition-colors link-underline">{text}</a>
                      : <span>{text}</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Form + Sidebar ── */}
      <section className="section-linen py-20 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-14">

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-6 reveal-left">
              <div>
                <p className="eyebrow mb-3">Direct Contacts</p>
                <h3 className="text-espresso mb-3" style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.6rem', fontWeight: 400 }}>
                  We'd Love to
                  <br /><em style={{ fontStyle: 'italic', color: '#8B5E3C' }}>Hear From You</em>
                </h3>
                <p className="text-fog text-sm font-light leading-relaxed">
                  Fill out the form and our team will respond within one business day.
                </p>
              </div>
              {[
                { icon: Mail,  label: "General Inquiries", value: "hello@globalleatherhub.com", href: "mailto:hello@globalleatherhub.com" },
                { icon: Phone, label: "Sales Hotline",     value: "+1 (212) 555-1234",           href: "tel:+12125551234" },
                { icon: Globe, label: "Website",           value: "www.globalleatherhub.com",    href: "#" },
              ].map(({ icon: Icon, label, value, href }) => (
                <a key={label} href={href}
                  className="flex items-center gap-4 card group hover:border-tan/40 transition-all duration-300 cursor-pointer">
                  <div className="w-10 h-10 bg-tan/10 border border-tan/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-tan/20 group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-4 h-4 text-tan" />
                  </div>
                  <div>
                    <p className="text-fog text-[10px] uppercase tracking-widest">{label}</p>
                    <p className="text-espresso text-sm font-medium group-hover:text-sienna transition-colors duration-200">{value}</p>
                  </div>
                </a>
              ))}
              <div className="card flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-sage rounded-full flex-shrink-0 animate-pulse" />
                <div>
                  <p className="text-sage text-sm font-medium">Responds in &lt; 24 hours</p>
                  <p className="text-fog text-[10px] mt-0.5">Mon–Fri, during business hours</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3 reveal-right">
              {submitted ? (
                <div className="card p-10 text-center flex flex-col items-center justify-center min-h-[420px] animate-scale-in">
                  <div className="w-16 h-16 bg-sage/10 border border-sage/20 rounded-2xl flex items-center justify-center mb-6 animate-float">
                    <CheckCircle className="w-8 h-8 text-sage" />
                  </div>
                  <h3 className="text-espresso mb-3" style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.6rem', fontWeight: 400 }}>
                    Message Received
                  </h3>
                  <p className="text-fog text-sm font-light leading-relaxed max-w-xs">
                    Our wholesale team will contact you at{" "}
                    <span className="text-espresso font-medium">{form.email}</span> within 24 hours.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: "", email: "", company: "", country: "", inquiryType: "", message: "" }); }}
                    className="btn-outline mt-8 text-[13px] py-2.5 px-6"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="card space-y-5">
                  <div className="mb-2">
                    <p className="eyebrow mb-1">Send a Message</p>
                    <h3 className="text-espresso" style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', fontWeight: 400 }}>
                      Start a Conversation
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[11px] tracking-widest uppercase text-fog font-medium mb-2">Full Name *</label>
                      <input name="name" value={form.name} onChange={handleChange} placeholder="John Smith"
                        className={`field ${errors.name ? "field-error" : ""}`} />
                      {errors.name && <p className="mt-1.5 text-[11px] text-rust flex items-center gap-1 animate-fade-in"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] tracking-widest uppercase text-fog font-medium mb-2">Company</label>
                      <div className="relative"><Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fog/50" />
                        <input name="company" value={form.company} onChange={handleChange} placeholder="Your company" className="field pl-10" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] tracking-widest uppercase text-fog font-medium mb-2">Country</label>
                      <div className="relative"><Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fog/50" />
                        <input name="country" value={form.country} onChange={handleChange} placeholder="e.g. United States" className="field pl-10" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-widest uppercase text-fog font-medium mb-2">Inquiry Type *</label>
                    <div className="relative"><Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fog/50" />
                      <select name="inquiryType" value={form.inquiryType} onChange={handleChange}
                        className={`field pl-10 ${errors.inquiryType ? "field-error" : ""}`}>
                        <option value="">Select inquiry type…</option>
                        {inquiryTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    {errors.inquiryType && <p className="mt-1.5 text-[11px] text-rust flex items-center gap-1 animate-fade-in"><AlertCircle className="w-3 h-3" />{errors.inquiryType}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-widest uppercase text-fog font-medium mb-2">Message *</label>
                    <textarea name="message" value={form.message} onChange={handleChange} rows={5}
                      placeholder="Tell us about your requirements: product type, quantity, timeline, customizations…"
                      className={`field resize-none ${errors.message ? "field-error" : ""}`} />
                    <div className="flex items-center justify-between mt-1">
                      {errors.message
                        ? <p className="text-[11px] text-rust flex items-center gap-1 animate-fade-in"><AlertCircle className="w-3 h-3" />{errors.message}</p>
                        : <span />}
                      <span className={`text-[10px] transition-colors duration-200 ${form.message.length < 20 ? "text-fog/40" : "text-sage"}`}>
                        {form.message.length} chars
                      </span>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-paper/30 border-t-paper rounded-full animate-spin-slow" />
                        Sending…
                      </span>
                    ) : <><Send className="w-4 h-4" /> Send Message</>}
                  </button>
                  <p className="text-center text-fog/40 text-[11px]">We never share your data with third parties.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 max-w-2xl mx-auto px-6 lg:px-10">
        <div className="mb-12 reveal">
          <p className="eyebrow mb-3">Common Questions</p>
          <h2 className="text-espresso" style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400 }}>
            Frequently <em style={{ fontStyle: 'italic', color: '#8B5E3C' }}>Asked</em>
          </h2>
        </div>
        <div className="space-y-2">
          {faqs.map(({ q, a }, i) => (
            <div
              key={i}
              className={`card overflow-hidden transition-all duration-300 reveal ${openFaq === i ? "border-tan/40 shadow-card" : ""}`}
              style={{ transitionDelay: `${i * 0.06}s` }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-0 py-1 text-left group"
              >
                <span className="text-espresso text-sm font-medium pr-4 group-hover:text-sienna transition-colors duration-200">{q}</span>
                <ChevronDown className={`w-4 h-4 text-tan flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              <div className={`faq-answer ${openFaq === i ? "open" : "closed"}`}>
                <div className="rule pt-4 mt-4">
                  <p className="text-fog text-sm leading-relaxed">{a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-fog/50 text-xs mt-8">
          Still have questions?{" "}
          <a href="mailto:hello@globalleatherhub.com" className="text-tan hover:text-sienna transition-colors link-underline">Email our team</a>
        </p>
      </section>
    </div>
  );
}

