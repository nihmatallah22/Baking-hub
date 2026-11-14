import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CategorySearch from "@/components/category-search";
import CategoryGrid from "@/components/category-grid";
import SiteFooter from "@/components/site-footer";

type Category = { id: string; name: string; description: string | null; slug: string };

export default async function HomePage() {
  let categories: Category[] = [];
  let connected = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("categories").select("id,name,description,slug").eq("is_active", true).order("sort_order", { ascending: true });
    if (!error) { categories = data ?? []; connected = true; }
  } catch { /* Keep the storefront visible while Supabase is configured. */ }

  return <main>
    <header className="site-header"><Link className="brand" href="/">Shadollar Cakes &amp; Treats<small>Made with love • Baked with care</small></Link><nav className="nav"><Link href="/">Home</Link><Link href="/about">About</Link><Link href="/shop">Shop</Link><Link className="nav-cta" href="/login">Sign in</Link></nav></header>
    <section className="store-hero">
      <div className="eyebrow">Welcome to Shadollar</div>
      <h1>Find something<br/><i>delicious.</i></h1>
      <p>From beautiful celebration cakes to tasty treats and event catering, explore our menu and find just what you need.</p>
      <div className="hero-actions"><a className="button" href="#categories">Explore categories <span>↘</span></a><CategorySearch categories={categories}/></div>
      <div className="hero-note">BAKED WITH CARE · MADE FOR YOUR MOMENTS</div>
    </section>
    <section className="section shop-section" id="categories">
      <div className="section-head section-head-row"><div><div className="eyebrow">Browse the menu</div><h2>What are you craving?</h2><p>Choose a category to view the available items, details and prices.</p></div><Link className="text-link" href="/shop">View all items ↗</Link></div>
      {categories.length ? <CategoryGrid categories={categories}/> : <div className="empty-note">{connected ? "Our menu is being prepared. Please check back soon." : "Connect Supabase and run the database setup to display your menu categories."}</div>}
    </section>
    <section className="about-strip"><div><div className="eyebrow">A little about us</div><h2>Every bite tells<br/>a sweeter story.</h2></div><div><p>We make cakes, treats and catering experiences with care, quality ingredients and attention to the details that make your celebrations memorable.</p><Link className="text-link" href="/about">Get to know us ↗</Link></div></section><SiteFooter/>
  </main>;
}