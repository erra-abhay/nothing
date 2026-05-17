"use client";

import { useState, useEffect } from "react";
import { Search, Filter, SlidersHorizontal, FileText, Loader2, SearchX } from "lucide-react";
import PaperCard from "@/components/papers/PaperCard";
import { cn } from "@/lib/utils";

export default function BrowsePage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [dept, setDept] = useState("");
  const [sem, setSem] = useState("");
  const [type, setType] = useState("");
  const [year, setYear] = useState("");

  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    // Fetch departments for filter
    fetch("/api/public/departments")
      .then(res => res.json())
      .then(res => {
        if (res.success) setDepartments(res.data);
      });
  }, []);

  useEffect(() => {
    async function fetchPapers() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (dept) params.append("department_id", dept);
        if (sem) params.append("semester", sem);
        if (type) params.append("paper_type", type);
        if (year) params.append("year", year);

        const res = await fetch(`/api/public/papers?${params.toString()}`);
        const data = await res.json();
        if (data.success) setPapers(data.data);
      } catch (err) {
        console.error("Fetch Papers Error:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchPapers, 300);
    return () => clearTimeout(timer);
  }, [search, dept, sem, type, year]);

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">Browse Papers</h1>
          <p className="text-muted-foreground">Search and filter through our extensive collection.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search subjects or codes..."
              className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-2 border rounded-lg transition-colors md:hidden",
              showFilters ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
            )}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className={cn(
          "lg:col-span-1 space-y-6",
          showFilters ? "block" : "hidden lg:block"
        )}>
          <div className="bg-card border rounded-xl p-6 sticky top-24">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Department</label>
                <select 
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full p-2 bg-background border rounded-md text-sm outline-none focus:border-primary transition-colors"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Semester</label>
                <select 
                  value={sem}
                  onChange={(e) => setSem(e.target.value)}
                  className="w-full p-2 bg-background border rounded-md text-sm outline-none focus:border-primary transition-colors"
                >
                  <option value="">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Paper Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2 bg-background border rounded-md text-sm outline-none focus:border-primary transition-colors"
                >
                  <option value="">All Types</option>
                  <option value="MSE-1">MSE-1</option>
                  <option value="MSE-2">MSE-2</option>
                  <option value="ESE">ESE</option>
                  <option value="Quiz">Quiz</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Year</label>
                <input 
                  type="number" 
                  placeholder="e.g. 2023"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full p-2 bg-background border rounded-md text-sm outline-none focus:border-primary transition-colors"
                />
              </div>

              <button 
                onClick={() => {
                  setDept("");
                  setSem("");
                  setType("");
                  setYear("");
                  setSearch("");
                }}
                className="w-full text-xs font-bold text-muted-foreground hover:text-primary transition-colors py-2"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </aside>

        {/* Papers Grid */}
        <div className="lg:col-span-3 relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {papers.map(paper => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>
          
          {!loading && papers.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed rounded-xl flex flex-col items-center">
              <SearchX className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground">No papers found</h3>
              <p className="text-muted-foreground/60 max-w-xs mt-2">Try adjusting your filters or search terms to find what you're looking for.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

