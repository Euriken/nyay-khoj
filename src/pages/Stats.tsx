import { useState, useEffect } from "react";
import { SearchHeader } from "@/components/SearchHeader";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Scale, Building2, Calendar, Gavel, BarChart2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from "recharts";

const API_BASE = import.meta.env.DEV ? "http://localhost:5001" : "https://euriken-nyay-khoj.hf.space";

interface StatData {
  total_cases: number;
  by_court: { court: string; count: number }[];
  by_type: { type: string; count: number }[];
  by_year: { year: number; count: number }[];
  by_ipc: { section: string; count: number }[];
  by_verdict: { verdict: string; count: number }[];
  by_court_type: { court_type: string; count: number }[];
}

const COLORS = ["#8B5CF6", "#3B82F6", "#14B8A6", "#10B981", "#F59E0B", "#EF4444", "#6366F1"];

const VERDICT_COLORS: Record<string, string> = {
  "Acquitted": "#10B981", // green
  "Convicted": "#EF4444", // red
  "Appeal Allowed": "#3B82F6", // blue
  "Dismissed": "#6B7280", // gray
  "See Judgment": "#8B5CF6", // purple
  "Allowed": "#06B6D4", // cyan
  "Partly Allowed": "#F59E0B" // amber
};

export default function Stats() {
  const [data, setData] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/stats`);
        if (!res.ok) throw new Error("Failed to load statistics");
        const statsData = await res.json();
        setData(statsData);
      } catch (err: any) {
        setError(err.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader />
        <div className="flex flex-col items-center justify-center mt-32 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm tracking-wide">Assembling dataset analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader />
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <p className="text-destructive text-lg mb-4">{error || "Failed to load statistics"}</p>
          <Link to="/" className="text-primary hover:underline text-sm">← Back to Search</Link>
        </div>
      </div>
    );
  }

  // Calculate some simple header stats
  const topCourt = data.by_court[0]?.court || "N/A";
  const criminalCount = data.by_type.find(t => t.type === "Criminal")?.count || 0;
  const criminalPercent = Math.round((criminalCount / data.total_cases) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SearchHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </Link>

        {/* Header Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-widest text-primary uppercase"
              style={{ fontFamily: "'Cinzel', serif" }}>
            Dataset Insights
          </h1>
          <p className="text-xs text-muted-foreground font-legal">
            Real-time aggregate data visualization of the Nyay Khoj court case records database
          </p>
        </div>

        {/* Header Stats: Total + Court Type breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-5 space-y-2 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground tracking-widest uppercase font-bold">Total Cases</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{data.total_cases.toLocaleString()}</span>
              <Scale className="h-5 w-5 text-primary/60 ml-auto" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-2 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground tracking-widest uppercase font-bold">Primary Court</span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold truncate max-w-[80%]">{topCourt}</span>
              <Building2 className="h-5 w-5 text-blue-500/60 ml-auto flex-shrink-0" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-2 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground tracking-widest uppercase font-bold">Criminal Focus</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{criminalPercent}%</span>
              <span className="text-xs text-muted-foreground">({criminalCount.toLocaleString()} cases)</span>
              <Gavel className="h-5 w-5 text-red-500/60 ml-auto" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-2 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground tracking-widest uppercase font-bold">Year Coverage</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">1950 — 2026</span>
              <Calendar className="h-5 w-5 text-teal-500/60 ml-auto" />
            </div>
          </div>
        </div>

        {/* Charts Grid Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Court Distribution Donut Chart */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-xs font-semibold tracking-wider text-primary uppercase">Judgments by Court</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.by_court}
                    dataKey="count"
                    nameKey="court"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {data.by_court.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1e2e", borderColor: "#313244", color: "#cdd6f4" }}
                    itemStyle={{ color: "#cdd6f4" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Verdict Donut Chart */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-xs font-semibold tracking-wider text-primary uppercase">Verdict Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.by_verdict}
                    dataKey="count"
                    nameKey="verdict"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {data.by_verdict.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={VERDICT_COLORS[entry.verdict] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1e2e", borderColor: "#313244", color: "#cdd6f4" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 — Year Line Chart */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h3 className="text-xs font-semibold tracking-wider text-primary uppercase">Judgments Trend (1950 - 2026)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.by_year} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
                <XAxis dataKey="year" stroke="#7f8497" fontSize={11} />
                <YAxis stroke="#7f8497" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e1e2e", borderColor: "#313244", color: "#cdd6f4" }}
                />
                <Area type="monotone" dataKey="count" name="Judgments" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Grid Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Case Type Bar Chart */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-xs font-semibold tracking-wider text-primary uppercase">Judgments by Case Type</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.by_type} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
                  <XAxis dataKey="type" stroke="#7f8497" fontSize={10} interval={0} tickFormatter={(value) => value.slice(0, 10)} />
                  <YAxis stroke="#7f8497" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1e2e", borderColor: "#313244", color: "#cdd6f4" }}
                  />
                  <Bar dataKey="count" name="Judgments" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                    {data.by_type.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top IPC Sections Cited */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wider text-primary uppercase">Top IPC Sections Cited</h3>
              <BarChart2 className="h-4 w-4 text-primary" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data.by_ipc}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
                  <XAxis type="number" stroke="#7f8497" fontSize={10} />
                  <YAxis dataKey="section" type="category" stroke="#7f8497" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1e2e", borderColor: "#313244", color: "#cdd6f4" }}
                  />
                  <Bar dataKey="count" name="Citations" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Court Type Distribution (Supreme vs High vs District) */}
        {(data.by_court_type?.length ?? 0) > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie chart */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <h3 className="text-xs font-semibold tracking-wider text-primary uppercase">Court Tier Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.by_court_type}
                      dataKey="count"
                      nameKey="court_type"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {data.by_court_type.map((_, index) => (
                        <Cell key={`ct-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e1e2e", borderColor: "#313244", color: "#cdd6f4" }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Number cards for each tier */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-3 flex flex-col justify-center">
              <h3 className="text-xs font-semibold tracking-wider text-primary uppercase">Court Tier Breakdown</h3>
              <div className="space-y-3">
                {data.by_court_type.map((ct, i) => {
                  const pct = data.total_cases > 0 ? Math.round((ct.count / data.total_cases) * 100) : 0;
                  return (
                    <div key={ct.court_type} className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-xs text-muted-foreground flex-1 truncate">{ct.court_type}</span>
                      <span className="text-xs font-semibold text-foreground tabular-nums">
                        {ct.count.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{pct}%</span>
                      <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-16 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground tracking-wide">
            © 2026 Nyay Khoj — Visual Dataset Diagnostics
          </p>
          <p className="text-xs text-primary/50 tracking-widest uppercase"
             style={{ fontFamily: "'Cinzel', serif" }}>
            Satyameva Jayate
          </p>
        </div>
      </footer>
    </div>
  );
}
