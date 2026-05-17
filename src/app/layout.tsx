import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SessionGuard from "@/components/auth/SessionGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "PaperVault | Question Paper Repository",
    template: "%s | PaperVault"
  },
  description: "The ultimate repository for college question papers. Access, search, and download past year papers easily. Built by BRIKIEN LABS.",
  keywords: ["question papers", "college repository", "university papers", "study material", "Brikien Labs", "PaperVault"],
  authors: [{ name: "BRIKIEN LABS", url: "https://brikienlabs.tech" }],
  creator: "BRIKIEN LABS",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://papervault.brikienlabs.tech",
    siteName: "PaperVault",
    title: "PaperVault | University Question Paper Repository",
    description: "The ultimate repository for college question papers by BRIKIEN LABS.",
    images: [{ url: "/logo.svg", width: 800, height: 600, alt: "PaperVault Logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PaperVault | Question Paper Repository",
    description: "Access and download college question papers easily.",
    images: ["/logo.svg"],
  },
  icons: {
    icon: [
      { url: "/logo.svg?v=1", type: "image/svg+xml" },
      { url: "/icon.svg?v=1", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/logo.svg?v=1", type: "image/svg+xml" },
    ],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <SessionGuard />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
