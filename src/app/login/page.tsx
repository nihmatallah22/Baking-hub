"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      router.replace(profile?.role === "admin" ? "/admin" : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Please check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Enter your email address first, then select Forgot password.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage("If an account exists for this email, a password reset link will be sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not send the reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-auth-page">
      <Link className="brand" href="/">
        Shadollar Cakes &amp; Treats
        <small>MADE WITH LOVE • BAKED WITH CARE</small>
      </Link>

      <form className="admin-panel admin-login-card" onSubmit={handleSubmit}>
        <div className="eyebrow">Welcome back</div>
        <h1>Sign in</h1>
        <p>Sign in to your Shadollar account to continue.</p>

        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
          />
        </label>

        <button className="text-link" type="button" onClick={handleForgotPassword} disabled={busy} style={{ alignSelf: "flex-end", background: "none", border: 0, padding: 0 }}>
          Forgot password?
        </button>

        {error && <p className="admin-alert admin-error" role="alert">{error}</p>}
        {message && <p className="admin-alert admin-success" role="status">{message}</p>}

        <button className="button admin-submit" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>

        <p style={{ textAlign: "center" }}>
          Don't have an account? <Link className="text-link" href="/signup">Create account</Link>
        </p>
        <Link className="text-link" href="/">Back to storefront</Link>
      </form>
    </main>
  );
}
