import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <details className="site-menu">
        <summary aria-label="Open navigation menu">
          <span className="menu-icon" aria-hidden="true"><i></i><i></i><i></i></span>
          <span>Menu</span>
        </summary>
        <nav className="menu-dropdown" aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/shop">Shop</Link>
        </nav>
      </details>
      <Link className="brand" href="/">
        Shadollar Cakes &amp; Treats
        <small>Made with love • Baked with care</small>
      </Link>
      <div className="header-auth">
        <Link className="header-auth-button" href="/signup">Sign Up</Link>
        <Link className="header-auth-button" href="/login">Log In</Link>
      </div>
    </header>
  );
}
