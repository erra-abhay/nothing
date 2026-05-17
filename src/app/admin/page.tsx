"use client";

import { useState, useEffect } from "react";
import {
  Building, BookOpen, Users, FileStack, Plus,
  Search, ShieldAlert, BarChart3, Settings,
  Activity, Loader2, AlertCircle, X, Pencil, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "departments" | "subjects" | "faculty" | "papers" | "stats" | "settings";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [statsRes, eventsRes] = await Promise.all([
          fetch("/api/public/stats").then(res => res.json()),
          fetch("/api/admin/events").then(res => res.json())
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (eventsRes.success) setEvents(eventsRes.data);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setError("Failed to load real-time data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [refreshTrigger]);

  const tabs = [
    { id: "stats", label: "Overview", icon: BarChart3 },
    { id: "departments", label: "Departments", icon: Building },
    { id: "subjects", label: "Subjects", icon: BookOpen },
    { id: "faculty", label: "Faculty", icon: Users },
    { id: "papers", label: "All Papers", icon: FileStack },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleReindex = async () => {
    try {
      setReindexing(true);
      const res = await fetch("/api/admin/reindex", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
      } else {
        alert("Re-index failed: " + data.error);
      }
    } catch (err) {
      alert("Network error during re-index.");
    } finally {
      setReindexing(false);
    }
  };

  if (error) {
    return (
      <div className="container py-20 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">{error}</h2>
        <button onClick={() => window.location.reload()} className="btn-primary mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Control Center</h1>
          <p className="text-muted-foreground">Manage the entire PaperVault ecosystem.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-bold text-xs uppercase tracking-widest border border-primary/20">
          <ShieldAlert className="w-4 h-4" />
          System Administrator
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <aside className="lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-[600px] card-premium p-0 overflow-hidden relative">
          {loading && !stats && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}

          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="font-bold text-xl flex items-center gap-2">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            {activeTab !== "stats" && activeTab !== "papers" && activeTab !== "settings" && (
              <button
                onClick={handleAdd}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add {activeTab.slice(0, -1)}
              </button>
            )}
          </div>

          <div className="p-6">
            {activeTab === "stats" && <StatsOverview stats={stats} events={events} />}
            {activeTab === "departments" && <DataList endpoint="/api/public/departments" label="Department" icon={Building} onEdit={handleEdit} refreshTrigger={refreshTrigger} />}
            {activeTab === "subjects" && <DataList endpoint="/api/public/subjects" label="Subject" icon={BookOpen} onEdit={handleEdit} refreshTrigger={refreshTrigger} />}
            {activeTab === "faculty" && <DataList endpoint="/api/admin/faculty" label="Faculty Member" icon={Users} columns={["name", "email", "is_active"]} onEdit={handleEdit} refreshTrigger={refreshTrigger} />}
            {activeTab === "papers" && <DataList endpoint="/api/public/papers" label="Paper" icon={FileStack} columns={["subject_name", "paper_type", "year"]} onEdit={handleEdit} refreshTrigger={refreshTrigger} />}
            {activeTab === "settings" && (
              <div className="space-y-8">
                <div className="p-6 border rounded-2xl bg-muted/20">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Search Engine
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Manage the RediSearch index. If search results seem outdated or missing, you can force a full re-index of the database.
                  </p>
                  <button 
                    onClick={handleReindex}
                    disabled={reindexing}
                    className="btn-primary flex items-center gap-2 px-6"
                  >
                    {reindexing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                    {reindexing ? "Indexing..." : "Re-index All Papers"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {isModalOpen && (
        <ManagementModal
          type={activeTab}
          item={editingItem}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}

function DataList({ endpoint, label, icon: Icon, columns = ["name", "code"], onEdit, refreshTrigger }: { endpoint: string, label: string, icon: any, columns?: string[], onEdit: (item: any) => void, refreshTrigger: number }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(endpoint);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error(`Fetch ${label} Error:`, err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [endpoint, label, refreshTrigger]);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : data.length > 0 ? (
        <div className="border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-6 py-4">#</th>
                {columns.map(col => (
                  <th key={col} className="px-6 py-4">{col.replace("_", " ")}</th>
                ))}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((item, i) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{i + 1}</td>
                  {columns.map(col => (
                    <td key={col} className="px-6 py-4 max-w-[200px] truncate">
                      {col === "is_active" ? (
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", item[col] ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                          {item[col] ? "Active" : "Inactive"}
                        </span>
                      ) : (
                        item[col] || "N/A"
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <h3 className="text-lg font-medium text-muted-foreground">No {label}s found</h3>
          <p className="text-sm text-muted-foreground/60 max-w-xs mt-2">
            Click the "Add" button above to create your first {label.toLowerCase()}.
          </p>
        </div>
      )}
    </div>
  );
}

function ManagementModal({ type, item, onClose, onSuccess }: { type: Tab, item: any, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>(item || {});
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    if (type === "subjects" || type === "faculty") {
      fetch("/api/public/departments")
        .then(res => res.json())
        .then(res => {
          if (res.success) setDepartments(res.data);
        });
    }
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = `/api/admin/${type}`;
      const method = item ? "PATCH" : "POST";
      const body = item ? { ...formData, id: item.id } : formData;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        alert(data.error || "Operation failed");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-card border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b flex items-center justify-between bg-muted/20">
          <h3 className="font-bold text-lg">{item ? 'Edit' : 'Add New'} {type.slice(0, -1)}</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {type === "departments" && (
            <>
              <div>
                <label className="text-xs font-bold uppercase mb-1 block">Department Name</label>
                <input
                  required
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.name || ""}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase mb-1 block">Short Code</label>
                <input
                  required
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.code || ""}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. CSE"
                />
              </div>
            </>
          )}

          {type === "subjects" && (
            <>
              <div>
                <label className="text-xs font-bold uppercase mb-1 block">Subject Name</label>
                <input
                  required
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.name || ""}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Data Structures"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase mb-1 block">Subject Code</label>
                <input
                  required
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.code || ""}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. CS201"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase mb-1 block">Department</label>
                  <select
                    required
                    className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.department_id || ""}
                    onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                  >
                    <option value="">Select Dept</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase mb-1 block">Semester</label>
                  <select
                    required
                    className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.semester || ""}
                    onChange={e => setFormData({ ...formData, semester: e.target.value })}
                  >
                    <option value="">Select Sem</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {type === "faculty" && (
            <>
              <div>
                <label className="text-xs font-bold uppercase mb-1 block">Full Name</label>
                <input
                  required
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.name || ""}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. John Doe"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase mb-1 block">Email Address</label>
                <input
                  required
                  type="email"
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.email || ""}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. john@university.edu"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase mb-1 block">Department</label>
                <select
                  required
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.department_id || ""}
                  onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                >
                  <option value="">Select Dept</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              {item && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">Account Active</label>
                </div>
              )}
            </>
          )}

          <div className="pt-4">
            <button
              disabled={loading}
              className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {item ? "Update" : "Save"} {type.slice(0, -1)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatsOverview({ stats, events }: { stats: any, events: any[] }) {
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatItem
          label="Total Papers"
          value={stats.counts.total_papers.toString()}
          sub="Stored in vault"
          color="text-primary"
        />
        <StatItem
          label="Total Downloads"
          value={stats.counts.total_downloads?.toString() || "0"}
          sub="Across all papers"
          color="text-secondary"
        />
        <StatItem
          label="Subjects"
          value={stats.counts.total_subjects.toString()}
          sub="Active curriculum"
          color="text-accent"
        />
        <StatItem
          label="Departments"
          value={stats.counts.total_departments.toString()}
          sub="Organized units"
          color="text-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 border rounded-xl bg-muted/20">
          <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Recent System Events
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {events.length > 0 ? (
              events.map((event, i) => (
                <EventItem
                  key={i}
                  type={event.type}
                  text={formatEventText(event)}
                  time={formatRelativeTime(event.timestamp)}
                  color={getEventColor(event.type)}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">No recent events recorded.</p>
            )}
          </div>
        </div>
        <div className="p-6 border rounded-xl bg-muted/20">
          <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Top Subjects</h3>
          <div className="space-y-4">
            {stats.topSubjects.slice(0, 5).map((subject: any) => (
              <ProgressItem
                key={subject.id}
                label={subject.name}
                value={Math.round((subject.total_downloads / (stats.counts.total_downloads || 1)) * 100)}
              />
            ))}
            {stats.topSubjects.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No download data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatEventText(event: any) {
  const userDisplay = event.user || `User ID ${event.userId || 'Unknown'}`;
  switch (event.type) {
    case "LOGIN_SUCCESS": return `${event.role || "User"} (${userDisplay}) logged in from ${event.ip}`;
    case "LOGIN_FAILED": return `Failed login attempt for ${event.email} from ${event.ip}`;
    case "ACCOUNT_LOCKED": return `Account ${event.email} locked from ${event.ip}`;
    case "FILE_UPLOAD": return `New paper uploaded by ${userDisplay}`;
    case "DATA_MODIFICATION": return `${event.table} entry modified by ${userDisplay}`;
    case "DATA_DELETION": return `${event.table} entry deleted by ${userDisplay}`;
    default: return `${event.type} detected from ${event.ip || "unknown"}`;
  }
}

function getEventColor(type: string) {
  if (type.includes("FAILED") || type.includes("LOCKED") || type.includes("ATTEMPT")) return "text-destructive";
  if (type.includes("UPLOAD") || type.includes("SUCCESS")) return "text-primary";
  return "text-muted-foreground";
}

function formatRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function StatItem({ label, value, sub, color }: { label: string, value: string, sub: string, color: string }) {
  return (
    <div className="p-6 border rounded-2xl hover:bg-muted/30 transition-colors">
      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      <div className={cn("text-3xl font-bold mb-1", color)}>{value}</div>
      <div className="text-[10px] font-medium text-muted-foreground">{sub}</div>
    </div>
  );
}

function EventItem({ type, text, time, color }: { type: string, text: string, time: string, color?: string }) {
  return (
    <div className="flex items-start justify-between text-sm py-1 border-b border-border/50 last:border-0">
      <div className="flex gap-3">
        <div className={cn("w-2 h-2 rounded-full mt-1.5", color?.includes("destructive") ? "bg-destructive" : color?.includes("primary") ? "bg-primary" : "bg-muted-foreground")} />
        <span className={cn("font-medium", color)}>{text}</span>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
    </div>
  );
}

function ProgressItem({ label, value }: { label: string, value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="truncate max-w-[200px]">{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function PlaceholderView({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-muted-foreground/30" />
      </div>
      <h3 className="text-lg font-medium text-muted-foreground">Management View for {label}</h3>
      <p className="text-sm text-muted-foreground/60 max-w-xs mt-2">
        This section will show the list of {label.toLowerCase()} with CRUD operations.
      </p>
    </div>
  );
}
