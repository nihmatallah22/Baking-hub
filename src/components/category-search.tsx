"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Category = { id: string; name: string; description: string | null; slug: string };

export default function CategorySearch({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return categories.filter((item) => `${item.name} ${item.description ?? ""}`.toLowerCase().includes(value));
  }, [categories, query]);

  return (
    <div className="hero-category-search">
      <label className="search-box">
        <span aria-hidden="true">⌕</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a category..." aria-label="Search categories" />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
      </label>
      {query.trim() && (
        <div className="search-suggestions">
          {filtered.length ? filtered.map((category) => (
            <Link href={`/shop/${category.slug}`} key={category.id}>
              <span><strong>{category.name}</strong><small>{category.description || "Browse items and prices"}</small></span><b>↗</b>
            </Link>
          )) : <p>No matching category. Try another search.</p>}
        </div>
      )}
    </div>
  );
}