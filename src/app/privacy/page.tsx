export default function PrivacyPolicy() {
  return (
    <div className="container py-20 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-muted-foreground mb-6">Last Updated: April 2026</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">1. Introduction</h2>
        <p>PaperVault ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4">2. Information We Collect</h2>
        <p>We collect information that you provide directly to us, such as when you log in as a faculty member or administrator. This may include your name, email address, and department details.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4">3. Use of Cookies</h2>
        <p>We use essential httpOnly cookies to maintain your session. These cookies are secure and cannot be accessed by client-side scripts.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4">4. Data Security</h2>
        <p>We implement a variety of security measures to maintain the safety of your personal information, including JWT authentication and secure session tracking.</p>
      </div>
    </div>
  );
}
