import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

const AUTOPLAY_MS = 5000;

// Wider crop (2400px) since the image now spans the full screen
const img = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=2400&q=80`;

const slides = [
  {
    image: img("photo-1517336714731-489689fd1ca8"),
    alt: "MacBook Pro on a wooden desk",
    badge: "Seasonal Sale",
    title: "MacBook Pro",
    highlight: "Up to 15% off",
    text: "Pro performance for editing, coding and everything in between.",
    cta: "Shop MacBook Pro",
    to: "/products",
  },
  {
    image: img("photo-1496181133206-80ce9b88a853"),
    alt: "MacBook Air on a table",
    badge: "Student Discount",
    title: "MacBook Air",
    highlight: "Extra 10% off for students",
    text: "Light, quiet and all-day battery. Just verify your student ID at checkout.",
    cta: "Claim student offer",
    to: "/products",
  },
  {
    image: img("photo-1544244015-0df4b3ffc6b0"),
    alt: "iPad with Apple Pencil",
    badge: "New Arrivals",
    title: "iPad",
    highlight: "Notes, art and study, anywhere",
    text: "Pair it with a Pencil and keyboard and turn it into your whole desk.",
    cta: "Explore iPads",
    to: "/products",
  },
  {
    image: img("photo-1572569511254-d8f925fe2cbb"),
    alt: "AirPods in their charging case",
    badge: "Limited Offer",
    title: "AirPods",
    highlight: "Save on audio bundles",
    text: "Seamless pairing, rich sound and a case that fits any pocket.",
    cta: "Shop AirPods",
    to: "/products",
  },
  {
    image: img("photo-1603302576837-37561b2e2302"),
    alt: "Gaming laptop with a backlit keyboard",
    badge: "Gaming Week",
    title: "Gaming Laptops",
    highlight: "Deals on top-tier rigs",
    text: "High refresh rates and serious GPUs, ready for your next match.",
    cta: "Shop gaming",
    to: "/products",
  },
];

/* Same width and padding as the Navbar so content lines up */
const inner = "mx-auto w-full max-w-7xl px-4 sm:px-6";

function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (index) => setCurrent((index + slides.length) % slides.length),
    [],
  );

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => goTo(current + 1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [current, paused, goTo]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured deals"
      className="relative h-[500px] w-full overflow-hidden bg-stone-200 sm:h-[580px] lg:h-[75vh] lg:max-h-[800px] lg:min-h-[600px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") goTo(current - 1);
        if (e.key === "ArrowRight") goTo(current + 1);
      }}
    >
      {slides.map((slide, i) => {
        const active = i === current;
        return (
          <div
            key={slide.title}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            aria-hidden={!active}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              active ? "z-10 opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.alt}
              loading={i === 0 ? "eager" : "lazy"}
              className={`h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${
                active ? "scale-105" : "scale-100"
              }`}
            />

            {/* Beige fade: bottom-up on mobile, left-to-right on desktop */}
            <div className="absolute inset-0 bg-[linear-gradient(to_top,#faf8f4_0%,rgba(250,248,244,0.65)_45%,rgba(250,248,244,0)_100%)] md:bg-[linear-gradient(to_right,#faf8f4_0%,rgba(250,248,244,0.88)_30%,rgba(250,248,244,0)_68%)]" />

            <div className="absolute inset-0 flex items-end pb-16 md:items-center md:pb-0">
              <div className={inner}>
                <div className="max-w-lg md:pl-4">
                  <span className="inline-block rounded-full border border-stone-300 bg-white/80 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-stone-700 backdrop-blur">
                    {slide.badge}
                  </span>

                  <h2 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl lg:text-7xl">
                    {slide.title}
                  </h2>

                  <p className="mt-2 text-lg font-medium text-stone-700 sm:text-xl lg:text-2xl">
                    {slide.highlight}
                  </p>

                  <p className="mt-3 hidden max-w-md text-sm leading-relaxed text-stone-600 sm:block sm:text-base">
                    {slide.text}
                  </p>

                  <Link
                    to={slide.to}
                    tabIndex={active ? 0 : -1}
                    className="group mt-6 inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700"
                  >
                    {slide.cta}
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Arrows, pinned to the screen edges */}
      <button
        type="button"
        onClick={() => goTo(current - 1)}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/85 text-stone-700 backdrop-blur transition hover:bg-white hover:text-stone-900 md:flex"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={() => goTo(current + 1)}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/85 text-stone-700 backdrop-blur transition hover:bg-white hover:text-stone-900 md:flex"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dots + counter, aligned with the Navbar content */}
      <div className="absolute inset-x-0 bottom-6 z-20">
        <div className={`${inner} flex items-center justify-between`}>
          <div className="flex items-center gap-2 md:pl-4">
            {slides.map((slide, i) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-8 bg-stone-900"
                    : "w-1.5 bg-stone-400 hover:bg-stone-600"
                }`}
              />
            ))}
          </div>

          <div className="text-xs tabular-nums tracking-widest text-stone-100 mix-blend-difference">
            {String(current + 1).padStart(2, "0")} /{" "}
            {String(slides.length).padStart(2, "0")}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroCarousel;