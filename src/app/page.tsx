import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Category = { id: string; name: string; description: string | null; slug: string };

export default async function HomePage() {
  let categories: Category[] = [];
  let connected = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,description,slug")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error) {
      categories = data ?? [];
      connected = true;
    }
  } catch {
    // The storefront remains viewable while local environment variables are being configured.
  }

  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/">Shadollar Cakes & Treats<small>Made with love • Baked with care</small></Link>
        <nav className="nav" aria-label="Main navigation">
          <a href="#categories">Shop</a>
          <a href="#about">Our story</a>
          <a href="#contact">Contact</a>
          <Link className="nav-cta" href="/login">Sign in</Link>
        </nav>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">A little sweetness for every occasion</div>
          <h1>Beautiful bakes.<br />Memorable moments.</h1>
          <p>From celebration cakes to delicious treats and thoughtful catering, let us make your special moments even sweeter.</p>
          <div className="hero-actions">
            <a className="button" href="#categories">Explore our menu</a>
            <a className="button secondary" href="#contact">Plan an event</a>
          </div>
        </div>
        <div className="hero-art" role="img" aria-label="Decorative bakery-inspired artwork"><span>♡</span></div>
      </section>

      <section className="section" id="categories">
        <div className="section-head">
          <div className="eyebrow">Find your favourite</div>
          <h2>Explore our categories</h2>
          <p>Choose something lovely for your celebration, your guests or simply because you deserve a treat.</p>
        </div>
        {categories.length ? (
          <div className="category-grid">
            {categories.map((category) => (
              <Link className="category-card" href={`/shop?category=${category.slug}`} key={category.id}>
                <strong>{category.name}</strong>
                <span>{category.description || "Discover delicious options"}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-note">
            {connected
              ? "Our menu is being prepared. Please check back soon."
              : "Connect your Supabase project and run the database setup to load your menu categories here."}
          </div>
        )}
      </section>

      <section className="section" id="about" style={{ background: "#f6ecdf" }}>
        <div className="section-head">
          <div className="eyebrow">The Shadollar touch</div>
          <h2>Made for your moments</h2>
          <p>We create cakes, treats and catering experiences with care, quality ingredients and attention to the little details that make every occasion special.</p>
        </div>
      </section>

      <footer className="site-footer" id="contact">
        <div><strong>Shadollar Cakes & Treats</strong><br /><small>Freshly baked, beautifully made.</small></div>
        <div><small>Call or WhatsApp: 07087981331</small><br /><small>© {new Date().getFullYear()} Shadollar Cakes & Treats</small></div>
      </footer>
    </main>
  );
}
