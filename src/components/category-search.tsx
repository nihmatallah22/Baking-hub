"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Category = { id: string; name: string; description: string | null; slug: string };

export default function CategorySearch({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return categories;
    return categories.filter((item) => `${item.name} ${item.description ?? ""}`.toLowerCase().includes(value));
  }, [categories, query]);

  return (
    <>
      <label className="search-box">
        <span aria-hidden="true">⌕</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cakes, treats, catering..." aria-label="Search categories" />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
      </label>
      {filtered.length ? (
        <div className="category-grid">
          {filtered.map((category, index) => (
            <Link className="category-card" href={`/shop/${category.slug}`} key={category.id}>
              <span className="category-number">0{index + 1}</span>
              <span className="category-arrow" aria-hidden="true">↗</span>
              <strong>{category.name}</strong>
              <span>{category.description || "Explore available options and prices."}</span>
              <em>View items &amp; prices</em>
            </Link>
          ))}
        </div>
      ) : <div className="empty-note">No categories match “{query}”. Try another search.</div>}
    </>
  );
}
