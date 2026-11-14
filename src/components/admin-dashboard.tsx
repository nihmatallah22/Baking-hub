"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Category = { id: string; name: string; slug: string; description: string | null };
type Product = { id: string; name: string; price: number; image_url: string | null; category_id: string | null };

function slugify(value: string) {
  return value.toLowerCase().trim().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminDashboard({ adminName }: { adminName: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadCatalogue() {
    const supabase = createClient();
    const [{ data: categoryRows }, { data: productRows }] = await Promise.all([
      supabase.from("categories").select("id,name,slug,description").order("sort_order"),
      supabase.from("products").select("id,name,price,image_url,category_id").order("created_at", { ascending: false })
    ]);
    setCategories(categoryRows ?? []);
    setProducts(productRows ?? []);
    if (!categoryId && categoryRows?.length) setCategoryId(categoryRows[0].id);
  }

  useEffect(() => { void loadCatalogue(); }, []);

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      const slug = slugify(categoryName);
      if (!slug) throw new Error("Enter a valid category name.");
      const { error: insertError } = await supabase.from("categories").insert({ name: categoryName.trim(), slug, description: categoryDescription.trim() || null, is_active: true });
      if (insertError) throw insertError;
      setCategoryName(""); setCategoryDescription(""); setMessage("Category added successfully."); await loadCatalogue();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not add category."); }
    finally { setBusy(false); }
  }

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (!categoryId) throw new Error("Please create or select a category first.");
      if (!image) throw new Error("Please choose a product photo to upload.");
      if (!image.type.startsWith("image/")) throw new Error("Please select an image file.");
      if (image.size > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller.");
      const supabase = createClient();
      const slug = slugify(productName) + "-" + crypto.randomUUID().slice(0, 8);
      const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${slug}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, image, { upsert: false, contentType: image.type });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("product-images").getPublicUrl(filePath);
      const { error: insertError } = await supabase.from("products").insert({
        name: productName.trim(), slug, description: description.trim() || null,
        price: Number(price), category_id: categoryId, image_url: publicData.publicUrl,
        is_active: true, is_available: true
      });
      if (insertError) {
        await supabase.storage.from("product-images").remove([filePath]);
        throw insertError;
      }
      setProductName(""); setDescription(""); setPrice(""); setImage(null);
      const input = document.getElementById("product-image") as HTMLInputElement | null;
      if (input) input.value = "";
      setMessage("Product and photo uploaded successfully. It is now available in the shop."); await loadCatalogue();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not upload product."); }
    finally { setBusy(false); }
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return <main className="admin-page">
    <header className="admin-topbar"><Link className="brand" href="/">Shadollar Cakes &amp; Treats<small>SHOP MANAGEMENT</small></Link><div className="admin-top-actions"><span>{adminName}</span><button type="button" className="admin-quiet-button" onClick={signOut}>Sign out</button></div></header>
    <section className="admin-heading"><div><div className="eyebrow">Your store, your control</div><h1>Admin dashboard</h1><p>Add categories and upload products, photos, descriptions and prices. Changes will appear on your storefront.</p></div><Link className="button" href="/" target="_blank">View storefront</Link></section>
    {(message || error) && <div className={error ? "admin-alert admin-error" : "admin-alert admin-success"} role="status">{error || message}</div>}
    <div className="admin-stats"><div><strong>{categories.length}</strong><span>Categories</span></div><div><strong>{products.length}</strong><span>Products</span></div></div>
    <div className="admin-columns">
      <section className="admin-panel"><div className="eyebrow">Organise your shop</div><h2>Add a category</h2><p>Create a category such as Birthday Cakes, Chin Chin, Small Chops or Wedding Cakes.</p>
        <form className="admin-form" onSubmit={addCategory}><label>Category name<input value={categoryName} onChange={e=>setCategoryName(e.target.value)} placeholder="e.g. Birthday Cakes" required/></label><label>Short description<textarea value={categoryDescription} onChange={e=>setCategoryDescription(e.target.value)} placeholder="A short introduction to this category"/></label><button className="button" disabled={busy}>{busy ? "Please wait..." : "Add category"}</button></form>
        <div className="admin-list-heading">Your categories</div>{categories.length ? <ul className="admin-category-list">{categories.map(c=><li key={c.id}><span>{c.name}</span><small>/{c.slug}</small></li>)}</ul> : <p className="admin-muted">No categories yet. Add your first category above.</p>}
      </section>
      <section className="admin-panel"><div className="eyebrow">Build your catalogue</div><h2>Upload a product</h2><p>Add the product name, category, price, details and a clear product photo.</p>
        <form className="admin-form" onSubmit={addProduct}><label>Product name<input value={productName} onChange={e=>setProductName(e.target.value)} placeholder="e.g. 2-tier vanilla birthday cake" required/></label><label>Category<select value={categoryId} onChange={e=>setCategoryId(e.target.value)} required><option value="">Choose a category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Price (₦)<input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} placeholder="e.g. 25000" required/></label><label>Product description<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe size, flavour, serving size or other details"/></label><label>Product photo<input id="product-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setImage(e.target.files?.[0] ?? null)} required/><small>JPG, PNG or WebP · Maximum 5 MB</small></label><button className="button" disabled={busy || !categories.length}>{busy ? "Uploading..." : "Upload product"}</button>{!categories.length && <small className="admin-muted">Add a category first to enable product uploads.</small>}</form>
      </section>
    </div>
    <section className="admin-panel admin-products"><div className="eyebrow">Current catalogue</div><h2>Products on your shop</h2>{products.length ? <div className="admin-product-list">{products.map(p=><div className="admin-product-row" key={p.id}>{p.image_url ? <img src={p.image_url} alt=""/> : <div className="admin-product-placeholder">SC</div>}<div><strong>{p.name}</strong><small>{categories.find(c=>c.id===p.category_id)?.name ?? "Uncategorised"}</small></div><b>₦{Number(p.price).toLocaleString("en-NG")}</b></div>)}</div> : <p className="admin-muted">Your uploaded products will appear here.</p>}</section>
  </main>;
}
