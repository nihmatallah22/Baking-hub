"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", userData.user?.id).single();
      if (profileError || profile?.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("This account does not have administrator access.");
      }
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="admin-auth-page">
    <Link className="brand" href="/">Shadollar Cakes &amp; Treats<small>ADMINISTRATOR ACCESS</small></Link>
    <form className="admin-panel admin-login-card" onSubmit={handleSubmit}>
      <div className="eyebrow">Secure area</div><h1>Admin log in</h1>
      <p>Login with the administrator account to manage your shop catalogue.</p>
      <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username"/></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></label>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <button className="button admin-submit" disabled={busy}>{busy ? "Logging in..." : "Login to admin"}</button>
      <Link className="text-link" href="/">← Back to storefront</Link>
    </form>
  </main>;
}
