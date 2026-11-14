"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: window.location.origin,
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        setMessage("Your account has been created successfully. You can now browse Shadollar Cakes & Treats.");
      } else {
        setMessage("Your account request has been received. Please check your email and click the confirmation link to activate your account.");
      }
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-auth-page">
      <Link className="brand" href="/">Shadollar Cakes &amp; Treats<small>MADE WITH LOVE • BAKED WITH CARE</small></Link>
      <form className="admin-panel admin-login-card" onSubmit={handleSubmit}>
        <div className="eyebrow">Join our sweet community</div>
        <h1>Create an account</h1>
        <p>Sign up to become part of the Shadollar Cakes &amp; Treats community.</p>

        <label>Full name
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required autoComplete="name" placeholder="Your full name" />
        </label>
        <label>Email address
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
        </label>
        <label>Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" />
        </label>
        <label>Confirm password
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="Enter your password again" />
        </label>

        {error && <p className="admin-alert admin-error" role="alert">{error}</p>}
        {message && <p className="admin-alert admin-success" role="status">{message}</p>}
        <button className="button admin-submit" disabled={busy}>{busy ? "Creating account..." : "Create account"}</button>
        <p style={{ textAlign: "center" }}>Already have an account? <Link className="text-link" href="/login">Sign in</Link></p>
        <Link className="text-link" href="/">Back to storefront</Link>
      </form>
    </main>
  );
}
