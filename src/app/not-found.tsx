"use client";

import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
        <FileQuestion className="w-24 h-24 text-primary relative z-10" />
      </div>
      
      <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter">404</h1>
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Page Not Found</h2>
      
      <p className="text-muted-foreground max-w-md mb-10 text-lg">
        The page you're looking for doesn't exist or has been moved. 
        Don't worry, your papers are still safe in the vault!
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/" className="btn-primary flex items-center justify-center gap-2 h-12 px-8">
          <Home className="w-5 h-5" />
          Back to Home
        </Link>
        <button 
          onClick={() => window.history.back()}
          className="btn-secondary flex items-center justify-center gap-2 h-12 px-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Go Back
        </button>
      </div>
      
      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-3xl opacity-50">
        <div className="p-4 border border-dashed rounded-lg">
          <div className="text-xs font-bold uppercase tracking-widest mb-1">Status</div>
          <div className="text-sm">Lost in Space</div>
        </div>
        <div className="p-4 border border-dashed rounded-lg">
          <div className="text-xs font-bold uppercase tracking-widest mb-1">Code</div>
          <div className="text-sm">ERR_PAGE_NOT_FOUND</div>
        </div>
        <div className="p-4 border border-dashed rounded-lg">
          <div className="text-xs font-bold uppercase tracking-widest mb-1">Action</div>
          <div className="text-sm">Keep Calm & Study</div>
        </div>
      </div>
    </div>
  );
}
