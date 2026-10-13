"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { site } from "@/lib/site";

// One list of links, shown two ways. From tablet width up it sits in the
// header on one line. At phone width it is a panel under the header that the
// Menu button opens; `open` only matters there.
export function MainNavigation() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButton.current?.focus();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <nav aria-label="Main">
      <button
        ref={menuButton}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className="-mr-3 h-11 px-3 text-small tracking-open text-platinum md:hidden"
      >
        {open ? "Close" : "Menu"}
      </button>

      <ul
        id={listId}
        className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col border-b border-line bg-ink px-gutter pt-4 pb-10 max-md:transition-[opacity,translate] max-md:duration-(--duration-calm) max-md:ease-settle max-md:starting:-translate-y-2 max-md:starting:opacity-0 md:static md:flex md:flex-row md:items-center md:gap-10 md:border-0 md:p-0`}
      >
        {site.navigation.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-3 font-display text-title text-platinum transition-colors duration-(--duration-quick) ease-settle md:py-0 md:font-sans md:text-small md:font-normal md:tracking-open md:whitespace-nowrap md:text-platinum-dim md:hover:text-platinum"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
