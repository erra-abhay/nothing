import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/logo.svg" alt="PaperVault" className="w-6 h-6" />
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-none">
                  PaperVault
                </span>
                <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">
                  by BRIKIEN LABS
                </span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              The ultimate repository for college question papers. Access, upload, and organize academic resources with ease.
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} PaperVault by BRIKIEN LABS. All rights reserved.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/browse" className="text-muted-foreground hover:text-primary transition-colors">Browse Papers</Link></li>
              <li><Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">Login</Link></li>
              <li><Link href="/documentation" className="text-muted-foreground hover:text-primary transition-colors">Documentation</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><a href="mailto:support@brikienlabs.tech" className="text-muted-foreground hover:text-primary transition-colors">Support</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
