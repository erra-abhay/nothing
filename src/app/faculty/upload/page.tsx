"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function UploadPaper() {
  const [file, setFile] = useState<File | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSubjects, setFetchingSubjects] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Form states
  const [subjectId, setSubjectId] = useState("");
  const [semester, setSemester] = useState("");
  const [paperType, setPaperType] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    fetch("/api/faculty/subjects")
      .then(res => res.json())
      .then(data => {
        if (data.success) setSubjects(data.data);
        setFetchingSubjects(false);
      })
      .catch(() => setFetchingSubjects(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      
      if (ext !== "pdf" && ext !== "docx") {
        setError("Only PDF and DOCX files are allowed.");
        setFile(null);
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size should not exceed 10MB.");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !subjectId || !semester || !paperType || !year) {
      setError("Please fill in all fields and select a file.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject_id", subjectId);
    formData.append("semester", semester);
    formData.append("paper_type", paperType);
    formData.append("year", year);

    try {
      const res = await fetch("/api/faculty/papers", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/faculty"), 2000);
      } else {
        setError(data.error || "Upload failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-green-500/10 text-green-500 flex items-center justify-center rounded-full mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Upload Successful!</h1>
        <p className="text-muted-foreground">Your paper has been added to the repository. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-3xl">
      <Link href="/faculty" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
        <ChevronLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Upload Question Paper</h1>
        <p className="text-muted-foreground">Add a new resource to the repository. All uploads are logged.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card-premium space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg flex gap-3 items-center">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Subject</label>
              <select 
                required
                className="w-full p-2.5 bg-background border rounded-lg outline-none focus:border-primary transition-colors"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={loading || fetchingSubjects}
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Semester</label>
              <select 
                required
                className="w-full p-2.5 bg-background border rounded-lg outline-none focus:border-primary transition-colors"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                disabled={loading}
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Paper Type</label>
              <select 
                required
                className="w-full p-2.5 bg-background border rounded-lg outline-none focus:border-primary transition-colors"
                value={paperType}
                onChange={(e) => setPaperType(e.target.value)}
                disabled={loading}
              >
                <option value="">Select Type</option>
                <option value="MSE-1">MSE-1</option>
                <option value="MSE-2">MSE-2</option>
                <option value="ESE">ESE</option>
                <option value="Quiz">Quiz</option>
                <option value="Assignment">Assignment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Year</label>
              <input 
                type="number"
                required
                min="2000"
                max={new Date().getFullYear() + 1}
                className="w-full p-2.5 bg-background border rounded-lg outline-none focus:border-primary transition-colors"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Paper File (PDF/DOCX)</label>
            <div className={cn(
              "relative border-2 border-dashed rounded-xl p-10 text-center transition-all",
              file ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50 border-muted"
            )}>
              <input 
                type="file" 
                accept=".pdf,.docx"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                disabled={loading}
              />
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                  file ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}>
                  {file ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                </div>
                <div className="text-sm font-medium">
                  {file ? file.name : "Click or drag and drop to upload"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF or DOCX up to 10MB"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary h-12 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Upload...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Confirm and Upload Paper
              </>
            )}
          </button>
          <Link href="/faculty" className="btn-secondary h-12 flex items-center px-8">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
