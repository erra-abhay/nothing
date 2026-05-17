"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Download, Edit, Trash2, LayoutDashboard } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Paper {
  id: number;
  subject_name: string;
  subject_code: string;
  semester: number;
  year: number;
  paper_type: string;
  download_count: number;
  created_at: string;
}

export default function FacultyDashboard() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faculty/papers")
      .then(res => res.json())
      .then(data => {
        if (data.success) setPapers(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">Faculty Portal</h1>
          <p className="text-muted-foreground">Manage your uploaded question papers.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/faculty/settings" className="btn-secondary flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Settings
          </Link>
          <Link href="/faculty/upload" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Upload New Paper
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card-premium">
          <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-2">Total Uploads</div>
          <div className="text-3xl font-bold">{papers.length}</div>
        </div>
        <div className="card-premium">
          <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-2">Total Downloads</div>
          <div className="text-3xl font-bold">
            {papers.reduce((acc, p: any) => acc + (p.download_count || 0), 0)}
          </div>
        </div>
        <div className="card-premium">
          <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-2">Recent Activity</div>
          <div className="text-sm font-medium text-primary">Last upload: {papers.length > 0 ? formatDate(papers[0].created_at) : "None"}</div>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="font-bold flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" />
            Your Papers
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Sem/Year</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Downloads</th>
                <th className="px-6 py-4">Uploaded</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">Loading your papers...</td></tr>
              ) : papers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">You haven't uploaded any papers yet.</td></tr>
              ) : (
                papers.map((paper: any) => (
                  <tr key={paper.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm">{paper.subject_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{paper.subject_code}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      Sem {paper.semester}, {paper.year}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase">
                        {paper.paper_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {paper.download_count}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {formatDate(paper.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
