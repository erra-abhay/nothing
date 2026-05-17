"use client";

import Link from "next/link";
import { Search, FileText, Download, ShieldCheck, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/stats")
      .then(res => res.json())
      .then(res => {
        if (res.success) setStats(res.data.counts);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Master Your Exams with <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              PaperVault
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Access a comprehensive collection of college question papers. 
            Download, study, and excel with PaperVault's secure repository.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse" className="btn-primary flex items-center justify-center gap-2 h-12 px-8">
              <Search className="w-5 h-5" />
              Browse Papers
            </Link>
            <Link href="/login" className="btn-secondary flex items-center justify-center gap-2 h-12 px-8">
              <ShieldCheck className="w-5 h-5" />
              Faculty Portal
            </Link>
          </div>
        </div>
        
        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary rounded-full blur-[120px]" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatBox 
              label="Papers" 
              value={stats?.total_papers ?? "500+"} 
              loading={loading}
            />
            <StatBox 
              label="Subjects" 
              value={stats?.total_subjects ?? "50+"} 
              loading={loading}
            />
            <StatBox 
              label="Depts" 
              value={stats?.total_departments ?? "5+"} 
              loading={loading}
            />
            <StatBox 
              label="Downloads" 
              value={stats?.total_downloads ?? "0"} 
              loading={loading}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-12">Why Choose PaperVault?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="card-premium">
              <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Extensive Library</h3>
              <p className="text-muted-foreground">
                Browse papers from all departments, categorized by semester, year, and examination type.
              </p>
            </div>
            <div className="card-premium">
              <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-6">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Access</h3>
              <p className="text-muted-foreground">
                One-click downloads for high-quality PDF papers, accessible anytime from any device.
              </p>
            </div>
            <div className="card-premium">
              <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure & Verified</h3>
              <p className="text-muted-foreground">
                All papers are uploaded by verified faculty members and validated for authenticity.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatBox({ label, value, loading }: { label: string, value: string | number, loading: boolean }) {
  return (
    <div className="text-center p-6 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all group">
      {loading ? (
        <Loader2 className="w-8 h-8 text-primary/20 animate-spin mx-auto mb-2" />
      ) : (
        <div className="text-3xl md:text-4xl font-black text-primary mb-1 group-hover:scale-110 transition-transform">
          {typeof value === 'number' && value > 999 ? `${(value/1000).toFixed(1)}k` : value}
        </div>
      )}
      <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{label}</div>
    </div>
  );
}
