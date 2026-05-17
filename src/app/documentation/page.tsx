export default function Documentation() {
  const sections = [
    {
      title: "For Students",
      content: "Students can browse question papers by department, semester, and subject. No login is required to download public resources."
    },
    {
      title: "For Faculty",
      content: "Faculty members can log in using their college email to upload and manage question papers for their respective departments."
    },
    {
      title: "File Formats",
      content: "PaperVault currently supports PDF and DOCX file formats. Each upload is limited to 10MB."
    },
    {
      title: "Security Measures",
      content: "The system uses JWT-based authentication and secure session tracking to ensure data integrity and prevent unauthorized access."
    }
  ];

  return (
    <div className="container py-20">
      <h1 className="text-4xl font-bold mb-4">Documentation</h1>
      <p className="text-muted-foreground mb-12 max-w-2xl">
        Everything you need to know about using the PaperVault repository.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section, idx) => (
          <div key={idx} className="card-premium">
            <h2 className="text-xl font-bold mb-4">{section.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
