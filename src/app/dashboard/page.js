import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export const metadata = {
  title: "Dashboard - Bill Generator",
  description: "Analytics dashboard for your bills.",
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <AnalyticsDashboard />
    </main>
  );
}
