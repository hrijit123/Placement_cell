"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

// Earthy palette matching the rest of the portal
const GREEN = "#2D4A22";
const BROWN = "#6B5E4C";
const TAN = "#C9B896";
const RUST = "#A0522D";
const CREAM_BORDER = "#E1D8C9";

const ATTENDANCE_COLORS: Record<string, string> = {
  PRESENT: GREEN,
  LATE: TAN,
  ABSENT: RUST,
};

export interface FunnelDatum {
  status: string;
  count: number;
}
export interface EmployerDatum {
  company: string;
  placements: number;
}
export interface AttendanceDatum {
  status: string;
  count: number;
}
export interface MonthlyDatum {
  month: string; // e.g. "Feb 2026"
  applications: number;
}

export default function ChartsSection({
  funnel,
  topEmployers,
  attendance,
  monthly,
}: {
  funnel: FunnelDatum[];
  topEmployers: EmployerDatum[];
  attendance: AttendanceDatum[];
  monthly: MonthlyDatum[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
      {/* Application funnel */}
      <ChartCard title="Application Pipeline" subtitle="Applications by current status">
        {funnel.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnel} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CREAM_BORDER} />
              <XAxis
                dataKey="status"
                tick={{ fill: BROWN, fontSize: 11 }}
                interval={0}
                angle={-30}
                textAnchor="end"
              />
              <YAxis allowDecimals={false} tick={{ fill: BROWN, fontSize: 12 }} />
              <Tooltip cursor={{ fill: "#FAF8F3" }} />
              <Bar dataKey="count" fill={GREEN} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Top employers */}
      <ChartCard title="Top Employers" subtitle="Companies by number of placements">
        {topEmployers.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={topEmployers}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CREAM_BORDER} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: BROWN, fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="company"
                width={110}
                tick={{ fill: BROWN, fontSize: 12 }}
              />
              <Tooltip cursor={{ fill: "#FAF8F3" }} />
              <Bar dataKey="placements" fill={BROWN} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Attendance ratio */}
      <ChartCard title="Attendance Ratio" subtitle="All recorded sessions">
        {attendance.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={attendance}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
              >
                {attendance.map((entry) => (
                  <Cell key={entry.status} fill={ATTENDANCE_COLORS[entry.status] || TAN} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Applications over time */}
      <ChartCard title="Application Volume" subtitle="Applications submitted per month (last 6 months)">
        {monthly.every((m) => m.applications === 0) ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthly} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CREAM_BORDER} />
              <XAxis dataKey="month" tick={{ fill: BROWN, fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: BROWN, fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="applications"
                stroke={GREEN}
                strokeWidth={2.5}
                dot={{ fill: GREEN, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
      <h2 className="text-xl font-serif text-[#2C241B]">{title}</h2>
      <p className="text-sm text-[#8B7D6B] mb-4">{subtitle}</p>
      {children}
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="h-[280px] flex items-center justify-center text-[#8B7D6B] italic">
      No data recorded yet.
    </div>
  );
}
