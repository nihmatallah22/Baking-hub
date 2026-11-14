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
        <div className="footer-column"><strong>Explore</strong><Link href="/">Home</Link><Link href="/about">About us</Link><Link href="/shop">Shop all</Link><Link href="/login">My account</Link></div>
        <div className="footer-column"><strong>Customer care</strong><Link href="/privacy-policy">Privacy policy</Link><Link href="/return-policy">Return policy</Link><a href="https://wa.me/2347087981331">Contact us on WhatsApp</a></div>
        <div className="footer-column"><strong>Follow us</strong><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a><a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook</a><a href="https://www.tiktok.com/" target="_blank" rel="noreferrer">TikTok</a><small>Add your business profile links in this footer when ready.</small></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Shadollar Cakes &amp; Treats. All rights reserved.</span><span>Made with love • Baked with care</span></div>
    </footer>
  );
}
