"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LogOut, User } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      }
    }
    checkUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Browse Papers", href: "/browse" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="PaperVault Logo" className="w-8 h-8" />
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-none">
              PaperVault
            </span>
            <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">
              by BRIKIEN LABS
            </span>
          </div>
        </Link>
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.name}
            </Link>
          ))}
          
          {user ? (
            <div className="flex items-center gap-4">
              <Link 
                href={user.role === "admin" ? "/admin" : "/faculty"}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <User className="w-4 h-4" />
                Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/login" ? "text-primary" : "text-muted-foreground"
              )}
            >
              Login
            </Link>
          )}

          <a
            href="https://brikienlabs.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            BRIKIEN Labs
          </a>
        </nav>
      </div>
    </header>
  );
}
