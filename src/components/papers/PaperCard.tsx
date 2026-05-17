import { Calendar, BookOpen, Download, Building } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface Paper {
  id: number;
  subject_name: string;
  subject_code: string;
  department_name: string;
  semester: number;
  paper_type: string;
  year: number;
  download_count: number;
  created_at: string;
}

export default function PaperCard({ paper }: { paper: Paper }) {
  return (
    <div className="card-premium flex flex-col group h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
            {paper.subject_name}
          </h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">{paper.subject_code}</p>
        </div>
        <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider">
          {paper.paper_type}
        </span>
      </div>

      <div className="space-y-2 mb-6 flex-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building className="w-4 h-4" />
          <span>{paper.department_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Sem {paper.semester} — {paper.year}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Download className="w-4 h-4" />
          <span>{paper.download_count} downloads</span>
        </div>
      </div>

      <div className="pt-4 border-t flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Uploaded: {formatDate(paper.created_at)}
        </span>
        <button 
          onClick={() => window.location.href = `/api/public/papers/${paper.id}/download`}
          className="btn-primary flex items-center gap-2 text-xs py-1.5 px-4"
        >
          <Download className="w-3 h-3" />
          Download PDF
        </button>
      </div>
    </div>
  );
}
