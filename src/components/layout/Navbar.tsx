"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Cpu, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_CONFIG } from "@/config/branding";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/#subjects", label: "Subjects" },
  { href: "/#rounds", label: "Rounds" },
  { href: "/#rules", label: "Rules" },
  { href: "/announcements", label: "Announcements" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/#faq", label: "FAQ" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isHome = pathname === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group shrink-0"
            aria-label={`${BRAND_CONFIG.name} — Home`}
          >
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-all duration-300 group-hover:scale-105">
              <Cpu className="h-5 w-5 text-white" aria-hidden />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-wider text-white">
                NEX<span className="text-indigo-400">ORA</span>
              </span>
              <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase -mt-1 hidden sm:inline">
                Regional Challenge
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden lg:flex items-center nav-pill"
            aria-label="Main navigation"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "nav-link",
                  (isHome && link.href === "/") || pathname === link.href
                    ? "active"
                    : ""
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <Link href="/login" className="btn-ghost !px-4 !py-2 text-sm">
              Sign In
            </Link>
            <Link href="/register" className="btn-gradient-border">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                Register Team
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="flex lg:hidden items-center justify-center h-9 w-9 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <nav
          id="mobile-nav"
          className="lg:hidden border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-md"
          aria-label="Mobile navigation"
        >
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md py-2.5 px-3 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t border-neutral-800 flex flex-col gap-2">
              <Link
                href="/login"
                className="btn-ghost !w-full !justify-center"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-primary !w-full !justify-center"
              >
                Register Team
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
