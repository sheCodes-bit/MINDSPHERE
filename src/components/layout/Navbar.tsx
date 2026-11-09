"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/#subjects", label: "Subjects" },
  { href: "/#rounds", label: "Rounds" },
  { href: "/#rules", label: "Rules" },
  { href: "/leaderboard", label: "Leaderboard" },
];

const MOBILE_EXTRA = [
  { href: "/announcements", label: "Announcements" },
  { href: "/#faq", label: "FAQ" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isHome = pathname === "/";
  const onDark = isHome && !isScrolled && !isMenuOpen;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled || isMenuOpen ? "header-glass" : isHome ? "bg-transparent" : "header-glass"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          <BrandLogo priority imgClassName="h-9 md:h-11" />

          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150",
                    onDark
                      ? "text-white/85 hover:text-white hover:bg-white/10"
                      : "text-slate-600 hover:text-blue-700 hover:bg-blue-50",
                    active && (onDark ? "text-white bg-white/15" : "text-blue-700 bg-blue-50")
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className={cn(
                "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border transition-all duration-200",
                onDark
                  ? "text-white border-white/40 hover:bg-white/10"
                  : "text-slate-700 border-slate-300 bg-white/70 hover:bg-white hover:border-slate-400"
              )}
            >
              Log in
            </Link>
            <Link href="/register" className="btn-primary !px-5 !py-2.5 text-sm">
              Register Now
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <button
            type="button"
            className={cn(
              "flex lg:hidden items-center justify-center h-10 w-10 rounded-lg transition-colors",
              onDark ? "text-white hover:bg-white/10" : "text-slate-700 hover:bg-slate-100"
            )}
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
          >
            {isMenuOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav id="mobile-nav" className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md" aria-label="Mobile navigation">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {[...NAV_LINKS, ...MOBILE_EXTRA].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg py-2.5 px-3 text-sm font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col gap-2">
              <Link href="/login" className="btn-ghost !w-full !justify-center">Log in</Link>
              <Link href="/register" className="btn-primary !w-full !justify-center">
                Register Now
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}