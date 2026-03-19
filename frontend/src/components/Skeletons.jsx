import React from "react";

const S = ({ className = "" }) => (
  <div className={`skeleton rounded-lg ${className}`} />
);

/* ── Product card skeleton ── */
export const ProductCardSkeleton = () => (
  <div className="bg-paper border border-border rounded-3xl overflow-hidden">
    <S className="w-full h-72 rounded-none" />
    <div className="p-6 space-y-3">
      <S className="h-2.5 w-1/3" />
      <S className="h-5 w-2/3" />
      <S className="h-2.5 w-full" />
      <div className="flex items-center justify-between pt-1">
        <S className="h-3.5 w-1/4" />
        <S className="h-3.5 w-1/6" />
      </div>
    </div>
  </div>
);

/* ── Stats strip skeleton ── */
export const StatsStripSkeleton = () => (
  <div className="bg-espresso py-10">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <S className="h-8 w-24 mx-auto bg-paper/10" />
            <S className="h-2.5 w-20 mx-auto bg-paper/10" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Testimonial card skeleton ── */
export const TestimonialSkeleton = () => (
  <div className="bg-paper border border-border rounded-2xl p-6 shadow-soft space-y-4">
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => <S key={i} className="w-3.5 h-3.5" />)}
    </div>
    <S className="h-3 w-full" />
    <S className="h-3 w-5/6" />
    <S className="h-3 w-4/6" />
    <div className="border-t border-border pt-4 space-y-1.5">
      <S className="h-3 w-1/3" />
      <S className="h-2.5 w-1/2" />
    </div>
  </div>
);

/* ── Page hero skeleton ── */
export const PageHeroSkeleton = () => (
  <section className="pt-36 pb-24 max-w-7xl mx-auto px-6 lg:px-10 space-y-4">
    <S className="h-2.5 w-28" />
    <S className="h-14 w-2/3" />
    <S className="h-14 w-1/2" />
    <S className="h-4 w-full max-w-xl" />
    <S className="h-4 w-4/5 max-w-lg" />
    <div className="flex gap-3 pt-3">
      <S className="h-12 w-36 rounded-full" />
      <S className="h-12 w-28 rounded-full" />
    </div>
  </section>
);

/* ── Profile skeleton ── */
export const ProfileSkeleton = () => (
  <div className="min-h-screen bg-canvas pt-20">
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-10 space-y-2">
        <S className="h-2.5 w-20" />
        <S className="h-10 w-52" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-paper border border-border rounded-2xl p-6 shadow-soft text-center space-y-3">
            <S className="w-20 h-20 rounded-full mx-auto" />
            <S className="h-5 w-32 mx-auto" />
            <S className="h-3 w-44 mx-auto" />
            <div className="flex gap-2 justify-center pt-1">
              <S className="h-6 w-20 rounded-full" />
              <S className="h-6 w-16 rounded-full" />
            </div>
          </div>
          <div className="bg-paper border border-border rounded-2xl p-6 shadow-soft space-y-3">
            <S className="h-2.5 w-24" />
            <S className="h-3 w-full" />
            <S className="h-3 w-full" />
          </div>
        </div>
        <div className="lg:col-span-2 space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-paper border border-border rounded-2xl p-6 shadow-soft space-y-4">
              <div className="flex justify-between items-center">
                <S className="h-6 w-36" />
                <S className="h-3 w-14" />
              </div>
              <S className="h-12 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ── Full-page loader ── */
export const FullPageLoader = () => (
  <div className="min-h-screen bg-canvas flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-border border-t-tan rounded-full animate-spin" />
      <p className="text-fog text-xs tracking-[0.2em] uppercase font-medium">Loading</p>
    </div>
  </div>
);

/* ── Form skeleton ── */
export const FormSkeleton = () => (
  <div className="bg-paper border border-border rounded-2xl p-6 shadow-soft space-y-5 max-w-sm">
    <S className="h-2.5 w-20" />
    <S className="h-8 w-40" />
    {[...Array(3)].map((_, i) => (
      <div key={i} className="space-y-2">
        <S className="h-2.5 w-28" />
        <S className="h-12 w-full rounded-xl" />
      </div>
    ))}
    <S className="h-12 w-full rounded-full" />
  </div>
);

export default {
  ProductCardSkeleton,
  StatsStripSkeleton,
  TestimonialSkeleton,
  PageHeroSkeleton,
  ProfileSkeleton,
  FullPageLoader,
  FormSkeleton,
};