import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Globe,
  Shield,
  Truck,
  Layers,
  Award,
  Users,
  Package,
  CheckCircle,
  Star,
  Phone,
  Mail,
  MapPin,
  ArrowUpRight,
  Scissors,
  Zap,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/authContext";
import { useScrollReveal } from "../hooks/useScrollReveal";

const stats = [
  { value: "50+", label: "Countries Served", suffix: "" },
  { value: "10K+", label: "Products Available", suffix: "" },
  { value: "5,000+", label: "Wholesale Partners", suffix: "" },
  { value: "15", label: "Years in Business", suffix: "yrs" },
];

const categories = [
  {
    name: "Leather Jackets",
    sub: "Biker · Bomber · Fashion · Moto",
    priceFrom: "from $45 / unit",
    moq: "MOQ 50 units",
    badge: "Best Seller",
    img: "/images/category-jackets.webp",
  },
  {
    name: "Leather Belts",
    sub: "Dress · Casual · Reversible",
    priceFrom: "from $8 / unit",
    moq: "MOQ 100 units",
    badge: "New Arrivals",
    img: "/images/category-belts.webp",
  },
  {
    name: "Leather Wallets",
    sub: "Bifold · Trifold · Cardholder",
    priceFrom: "from $12 / unit",
    moq: "MOQ 200 units",
    badge: "Popular",
    img: "/images/category-wallets.webp",
  },
];

const features = [
  {
    icon: Shield,
    title: "Genuine Leather Certified",
    desc: "ISO 9001 quality management. 12-point QC inspection on every unit.",
  },
  {
    icon: Layers,
    title: "Private Label & OEM",
    desc: "Your branding, your packaging. Available from 200 units per style.",
  },
  {
    icon: Truck,
    title: "Global Shipping",
    desc: "Tracked delivery to 50+ countries. Customs documentation included.",
  },
  {
    icon: Award,
    title: "Volume Pricing Tiers",
    desc: "Transparent bulk discounts — the more you order, the better your margins.",
  },
];

const process = [
  {
    n: "01",
    title: "Browse Catalog",
    desc: "Explore 10,000+ products with specs and live bulk pricing.",
    icon: Package,
  },
  {
    n: "02",
    title: "Request Quote",
    desc: "Submit MOQ and customization details in under 5 minutes.",
    icon: Scissors,
  },
  {
    n: "03",
    title: "Confirm & Pay",
    desc: "Secure via T/T, LC, or business credit card.",
    icon: CheckCircle,
  },
  {
    n: "04",
    title: "Production & QC",
    desc: "Rigorous 12-point inspection before every dispatch.",
    icon: Zap,
  },
  {
    n: "05",
    title: "Global Delivery",
    desc: "Tracked door-to-port shipping with full documentation.",
    icon: Truck,
  },
];

const testimonials = [
  {
    name: "Carlos Mendez",
    role: "Owner · Mendez Leather",
    country: "Mexico",
    quote:
      "Quality is consistently excellent and their pricing is unmatched at our volume level.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Procurement · StyleHub",
    country: "India",
    quote:
      "500 jackets in three weeks. The team was professional and communicative throughout.",
    rating: 5,
  },
  {
    name: "James Okafor",
    role: "Director · Lagos Fashion Imports",
    country: "Nigeria",
    quote:
      "The private label service transformed our business — customers love the branded experience.",
    rating: 5,
  },
];

const marqueeItems = [
  "ISO 9001 Certified",
  "Genuine Leather",
  "50+ Countries",
  "Private Label Available",
  "MOQ from 50 Units",
  "15 Years Experience",
  "Worldwide Shipping",
  "5,000+ Partners",
  "Chrome-Free Tanning",
  "Custom Branding",
  "ISO 9001 Certified",
  "Genuine Leather",
  "50+ Countries",
  "Private Label Available",
  "MOQ from 50 Units",
  "15 Years Experience",
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const heroRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [activeCategory, setActiveCategory] = useState(0);

  useScrollReveal([]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-canvas text-espresso overflow-x-hidden page-enter">
      {/* ════════════════ HERO ════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col justify-end overflow-hidden"
      >
        <img
          src="/images/landing-hero.webp"
          alt="Premium leather workshop Lahore"
          className="absolute inset-0 w-full h-full object-cover object-center parallax-img"
          style={{ transform: `scale(1.08) translateY(${scrollY * 0.15}px)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/50 to-canvas/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas/70 via-canvas/20 to-transparent" />

        {/* Decorative corner marks */}
        <div
          className="absolute top-24 right-8 lg:right-16 hidden md:block animate-fade-in"
          style={{ animationDelay: "1.2s" }}
        >
          <div className="w-px h-16 bg-tan/30 mx-auto mb-2" />
          <div
            className="text-tan/50 text-[9px] tracking-[0.3em] uppercase rotate-90 origin-center"
            style={{ marginTop: "2rem" }}
          >
            Scroll
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pb-24 pt-8 md:pb-36 md:pt-0 w-full">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3 md:mb-5 animate-fade-up">
              Wholesale · Since 2009
            </p>
            <h1
              className="text-espresso leading-[1.1] md:leading-[1.05] mb-4 md:mb-6 animate-fade-up stagger-1"
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: "clamp(2.5rem, 7vw, 6rem)",
                fontWeight: 400,
              }}
            >
              Premium Leather,
              <br />
              <em style={{ fontStyle: "italic", color: "#8B5E3C" }}>
                Direct from Source.
              </em>
            </h1>
            <p className="text-fog text-base md:text-lg font-light leading-relaxed mb-6 md:mb-10 max-w-lg animate-fade-up stagger-2">
              Authentic jackets, belts, and wallets sourced straight from our
              Lahore factory. Trusted by 5,000+ international retailers and
              wholesalers.
            </p>
            <div className="flex flex-wrap gap-3 mb-8 md:mb-12 animate-fade-up stagger-3">
              {isAuthenticated ? (
                <Link to="/profile" className="btn-primary">
                  My Account <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary">
                    Start Buying <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/login" className="btn-outline">
                    Sign In
                  </Link>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-4 md:gap-5 animate-fade-up stagger-4">
              {[
                { icon: CheckCircle, text: "No hidden fees" },
                { icon: Shield, text: "Genuine leather certified" },
                { icon: Globe, text: "Ships to 50+ countries" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2 text-fog text-xs md:text-[13px]"
                >
                  <Icon className="w-4 h-4 text-tan flex-shrink-0" />
                  <span className="whitespace-nowrap">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ MARQUEE STRIP ════════════════ */}
      <div className="bg-tan py-3 overflow-hidden">
        <div className="ticker-wrap">
          <div className="marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-3 mx-5 text-paper text-[11px] font-medium tracking-[0.15em] uppercase"
              >
                <span className="w-1 h-1 bg-paper/50 rounded-full" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════ STATS STRIP ════════════════ */}
      <section className="bg-espresso text-paper py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map(({ value, label }, i) => (
              <div
                key={label}
                className="reveal"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <p
                  className="text-3xl md:text-4xl text-tan mb-1"
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 400,
                  }}
                >
                  {value}
                </p>
                <p className="text-paper/50 text-xs tracking-widest uppercase font-medium">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ CATEGORIES ════════════════ */}
      <section className="py-28 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 gap-4 reveal">
          <div>
            <p className="eyebrow mb-3">Our Collections</p>
            <h2
              className="text-espresso leading-tight"
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 400,
              }}
            >
              Wholesale Leather{" "}
              <em style={{ fontStyle: "italic", color: "#8B5E3C" }}>Goods</em>
            </h2>
          </div>
          <Link
            to="/products"
            className="btn-ghost text-[13px] self-start md:self-auto"
          >
            View Full Catalogue <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((c, i) => (
            <div
              key={c.name}
              className={`group cursor-pointer reveal card-lift bg-paper border border-border rounded-3xl overflow-hidden ${
                i === activeCategory ? "lg:ring-2 lg:ring-tan/40" : ""
              }`}
              style={{ transitionDelay: `${i * 0.12}s` }}
              onClick={() => setActiveCategory(i)}
            >
              <div className="relative h-72 img-zoom overflow-hidden">
                <img
                  src={c.img}
                  alt={c.name}
                  className="w-full h-full object-cover transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                <div className="absolute top-4 left-4">
                  <span className="badge-tan text-[10px]">{c.badge}</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-400">
                  <Link
                    to="/products"
                    className="btn-tan w-full text-[12px] py-2.5 justify-center"
                  >
                    Request Quote <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <p className="text-fog text-[10px] uppercase tracking-widest mb-1">
                  {c.sub}
                </p>
                <h3
                  className="text-espresso text-xl mb-3"
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 400,
                  }}
                >
                  {c.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sienna text-sm font-medium">
                    {c.priceFrom}
                  </span>
                  <span className="badge-linen text-[10px]">{c.moq}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════ FEATURES (editorial layout) ════════════════ */}
      <section className="section-linen py-24 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: photo stack */}
            <div className="relative h-[520px] reveal-left">
              <img
                src="/images/feature-craft.webp"
                alt="Leather craftsmanship"
                className="absolute top-0 left-0 w-[75%] h-[400px] object-cover rounded-3xl shadow-card"
              />
              <img
                src="/images/feature-texture.webp"
                alt="Leather texture detail"
                className="absolute bottom-0 right-0 w-[55%] h-[260px] object-cover rounded-2xl shadow-hover border-4 border-canvas animate-float"
                style={{ animationDelay: "0.5s" }}
              />
              {/* Floating badge */}
              <div className="absolute top-[38%] right-[22%] bg-espresso text-paper rounded-2xl px-4 py-3 shadow-hover animate-fade-in stagger-5 text-center">
                <p
                  className="text-tan text-lg font-semibold"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  4.9★
                </p>
                <p className="text-paper/60 text-[9px] tracking-widest uppercase mt-0.5">
                  Avg Rating
                </p>
              </div>
            </div>

            {/* Right: features */}
            <div className="reveal-right">
              <p className="eyebrow mb-4">Why Choose Us</p>
              <h2
                className="text-espresso leading-tight mb-8"
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
                  fontWeight: 400,
                }}
              >
                Built for Serious
                <br />
                <em style={{ fontStyle: "italic", color: "#8B5E3C" }}>
                  Wholesalers.
                </em>
              </h2>
              <div className="space-y-5">
                {features.map(({ icon: Icon, title, desc }, i) => (
                  <div
                    key={title}
                    className="flex gap-4 group p-4 rounded-2xl hover:bg-paper transition-all duration-300 cursor-default"
                    style={{ transitionDelay: `${i * 0.08}s` }}
                  >
                    <div className="w-11 h-11 bg-tan/10 border border-tan/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-tan/20 group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-5 h-5 text-tan" />
                    </div>
                    <div>
                      <h3 className="text-espresso text-sm font-semibold mb-1">
                        {title}
                      </h3>
                      <p className="text-fog text-xs leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/about" className="btn-outline text-sm">
                  Our Story <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ PROCESS (horizontal timeline) ════════════════ */}
      <section className="py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16 reveal">
            <p className="eyebrow mb-3">The Process</p>
            <h2
              className="text-espresso"
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 400,
              }}
            >
              From Browse to
              <em style={{ fontStyle: "italic", color: "#8B5E3C" }}>
                {" "}
                Doorstep
              </em>
            </h2>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {/* Dashed line */}
            <div className="absolute top-8 left-[10%] right-[10%] border-t-2 border-dashed border-tan/20 hidden lg:block" />

            {process.map(({ n, title, desc, icon: Icon }, i) => (
              <div
                key={n}
                className="relative text-center group reveal"
                style={{ transitionDelay: `${i * 0.12}s` }}
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-paper border-2 border-border group-hover:border-tan group-hover:bg-tan/5 step-icon transition-all duration-300 flex items-center justify-center shadow-soft relative z-10">
                  <span
                    className="text-tan text-lg group-hover:scale-110 inline-block transition-transform duration-300"
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontWeight: 500,
                    }}
                  >
                    {n}
                  </span>
                </div>
                <Icon className="w-4 h-4 text-fog mx-auto mb-2 group-hover:text-tan transition-colors duration-300" />
                <p className="text-espresso text-sm font-semibold mb-1.5">
                  {title}
                </p>
                <p className="text-fog text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ SOCIAL PROOF STRIP ════════════════ */}
      <div className="bg-linen border-y border-border py-6 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-wrap items-center gap-6 justify-center md:justify-between">
            <p className="text-fog text-[11px] uppercase tracking-widest">
              Trusted by buyers from
            </p>
            {[
              "🇺🇸 USA",
              "🇬🇧 UK",
              "🇦🇺 Australia",
              "🇩🇪 Germany",
              "🇯🇵 Japan",
              "🇳🇬 Nigeria",
              "🇮🇳 India",
              "🇨🇦 Canada",
            ].map((c) => (
              <span key={c} className="text-espresso/60 text-sm font-light">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════ TESTIMONIALS ════════════════ */}
      <section className="section-paper py-24 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-14 reveal">
            <p className="eyebrow mb-3">What Buyers Say</p>
            <h2
              className="text-espresso"
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 400,
              }}
            >
              Partner{" "}
              <em style={{ fontStyle: "italic", color: "#8B5E3C" }}>Stories</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, country, quote, rating }, i) => (
              <div
                key={name}
                className="card card-lift group reveal"
                style={{ transitionDelay: `${i * 0.15}s` }}
              >
                <div className="flex gap-0.5 mb-5">
                  {[...Array(rating)].map((_, j) => (
                    <Star
                      key={j}
                      className="w-3.5 h-3.5 text-tan fill-tan group-hover:scale-110 transition-transform duration-200"
                      style={{ transitionDelay: `${j * 0.05}s` }}
                    />
                  ))}
                </div>
                <p
                  className="text-espresso/80 leading-relaxed mb-6 text-[15px]"
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontStyle: "italic",
                    fontWeight: 400,
                  }}
                >
                  "{quote}"
                </p>
                <div className="rule pt-5">
                  <p className="text-espresso text-sm font-medium">{name}</p>
                  <p className="text-fog text-xs mt-0.5">
                    {role} · {country}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ CTA BANNER ════════════════ */}
      <section className="relative py-32 bg-espresso overflow-hidden">
        <img
          src="/images/cta-factory.webp"
          alt="Leather manufacturing"
          className="absolute inset-0 w-full h-full object-cover opacity-15"
        />
        {/* Animated gradient orbs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-tan/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-sienna/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <p className="eyebrow text-tan mb-5 animate-fade-up">
            Ready to Scale?
          </p>
          <h2
            className="text-paper leading-tight mb-6 animate-fade-up stagger-1"
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
              fontWeight: 400,
            }}
          >
            Scale Your Leather
            <br />
            <em style={{ fontStyle: "italic", color: "#C9A97A" }}>
              Business Today.
            </em>
          </h2>
          <p className="text-paper/55 font-light mb-10 text-sm leading-relaxed max-w-md mx-auto animate-fade-up stagger-2">
            Join thousands of wholesalers who trust Global Leather Hub for
            consistent quality, competitive pricing, and reliable global
            shipping.
          </p>
          <div className="flex flex-wrap gap-3 justify-center animate-fade-up stagger-3">
            <Link to="/register" className="btn-tan">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="mailto:wholesale@globalleatherhub.com"
              className="btn-outline border-paper/30 text-paper hover:bg-paper/10 hover:border-paper/60"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="bg-paper border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="mb-4">
                <span
                  className="text-espresso text-xl"
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 400,
                  }}
                >
                  Global Leather Hub
                </span>
                <p className="text-fog text-[9px] tracking-[0.28em] uppercase mt-0.5 font-medium">
                  Wholesale Platform
                </p>
              </div>
              <p className="text-fog text-xs leading-relaxed max-w-xs mb-5">
                Premium wholesale leather goods for international buyers.
                Jackets, belts, and wallets shipped worldwide.
              </p>
              <div className="space-y-2">
                {[
                  {
                    icon: Mail,
                    text: "wholesale@globalleatherhub.com",
                    href: "mailto:wholesale@globalleatherhub.com",
                  },
                  {
                    icon: Phone,
                    text: "+1 (212) 555-1234",
                    href: "tel:+12125551234",
                  },
                  {
                    icon: MapPin,
                    text: "New York, USA · Factory: Lahore, Pakistan",
                  },
                ].map(({ icon: Icon, text, href }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2 text-fog text-xs"
                  >
                    <Icon className="w-3.5 h-3.5 text-tan/70 flex-shrink-0" />
                    {href ? (
                      <a
                        href={href}
                        className="hover:text-espresso transition-colors link-underline"
                      >
                        {text}
                      </a>
                    ) : (
                      <span>{text}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {[
              {
                title: "Products",
                links: [
                  "Leather Jackets",
                  "Leather Belts",
                  "Leather Wallets",
                  "Custom Orders",
                  "Private Label",
                ],
              },
              {
                title: "Company",
                links: [
                  "About Us",
                  "How It Works",
                  "Bulk Orders",
                  "Shipping",
                  "Contact",
                ],
              },
              {
                title: "Legal",
                links: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
              },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-[10px] tracking-[0.2em] uppercase font-semibold text-espresso/60 mb-4">
                  {title}
                </h4>
                <ul className="space-y-2.5">
                  {links.map((item) => (
                    <li key={item}>
                      <Link
                        to="/"
                        className="text-fog text-xs hover:text-espresso transition-colors font-light link-underline"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="rule pt-8 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-fog/60 text-xs">
              © {new Date().getFullYear()} Global Leather Hub. All rights
              reserved.
            </p>
            <p className="text-fog/40 text-xs">
              Crafted for serious wholesalers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}