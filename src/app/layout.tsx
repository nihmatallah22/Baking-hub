import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shadollar Cakes & Treats | Baked with Love",
  description: "Beautiful cakes, treats and catering for your special moments."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
