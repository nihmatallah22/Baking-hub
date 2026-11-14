import Link from "next/link";

type Category = { id: string; name: string; description: string | null; slug: string };

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="category-grid">
      {categories.map((category, index) => (
        <Link className="category-card" href={`/shop/${category.slug}`} key={category.id}>
          <span className="category-number">{String(index + 1).padStart(2, "0")}</span>
          <strong>{category.name}</strong>
          <span>{category.description || "Explore available options and prices."}</span>
          <em>View items &amp; prices</em>
        </Link>
      ))}
    </div>
  );
}