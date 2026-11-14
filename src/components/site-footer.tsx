import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <Link className="footer-brand" href="/">Shadollar Cakes &amp; Treats</Link>
          <p>Freshly baked, beautifully made. Bringing sweetness and thoughtful catering to every occasion.</p>
          <a className="footer-contact" href="https://wa.me/2347087981331">WhatsApp: 07087981331</a>
        </div>
        <div className="footer-column"><strong>Explore</strong><Link href="/">Home</Link><Link href="/about">About us</Link><Link href="/shop">Shop all</Link><Link href="/login">My account</Link><Link href="/admin/login">Admin</Link></div>
        <div className="footer-column"><strong>Customer care</strong><Link href="/privacy-policy">Privacy policy</Link><Link href="/return-policy">Return policy</Link><a href="https://wa.me/2347087981331">Contact us on WhatsApp</a></div>
        <div className="footer-column"><strong>Follow us</strong><a href="https://www.instagram.com/explore/search/keyword/?q=Shadollar%20Cakes%20and%20Treats" target="_blank" rel="noreferrer">Instagram · Shadollar Cakes and Treats</a><span>Facebook · Coming soon</span><a href="https://www.tiktok.com/search?q=Shadollar%20cakes" target="_blank" rel="noreferrer">TikTok · Shadollar cakes</a></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Shadollar Cakes &amp; Treats. All rights reserved.</span><span>Made with love • Baked with care</span></div>
    </footer>
  );
}
