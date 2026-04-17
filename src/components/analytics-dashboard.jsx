"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

import { db } from "@/lib/firebase";
import { translations } from "@/lib/translations";
import { formatCurrency, formatDisplayDate } from "@/lib/formatters";
import { Card, SectionHeading, Input, Field } from "@/components/ui";

function getStatus(bill) {
  const gtotal = bill.grand_total || 0;
  const adv = bill.advance || 0;
  if (adv >= gtotal) return { label: "Paid", color: "bg-emerald-100 text-emerald-800" };
  if (adv > 0) return { label: "Partial", color: "bg-amber-100 text-amber-800" };
  return { label: "Unpaid", color: "bg-rose-100 text-rose-800" };
}

export function AnalyticsDashboard() {
  const [lang, setLang] = useState("en");
  const t = translations[lang];
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const q = query(collection(db, "bills"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setBills(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (!b.date) return true;
      if (dateFrom && b.date < dateFrom) return false;
      if (dateTo && b.date > dateTo) return false;
      return true;
    });
  }, [bills, dateFrom, dateTo]);

  const stats = useMemo(() => {
    let revenue = 0;
    let advance = 0;
    filteredBills.forEach((b) => {
      revenue += b.grand_total || 0;
      advance += b.advance || 0;
    });
    return {
      revenue,
      advance,
      pending: revenue - advance,
      count: filteredBills.length,
    };
  }, [filteredBills]);

  const monthlyChartData = useMemo(() => {
    const dataMap = {};
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthStr = d.toLocaleString("default", { month: "short" });
      dataMap[key] = {
        name: `${monthStr} ${d.getFullYear().toString().slice(-2)}`,
        revenue: 0,
        advance: 0,
        sortKey: key,
      };
    }

    filteredBills.forEach((b) => {
      if (!b.date) return;
      const key = b.date.substring(0, 7);
      if (dataMap[key]) {
        dataMap[key].revenue += b.grand_total || 0;
        dataMap[key].advance += b.advance || 0;
      }
    });

    return Object.values(dataMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredBills]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-brand px-5 py-6 text-white shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-3xl font-bold">{t.dashboard}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setLang((current) => (current === "en" ? "gu" : "en"))}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
          >
            EN | ગુ
          </button>
          <Link
            href="/admin"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand transition hover:bg-slate-100"
          >
            {t.adminPanel || "Admin Panel"}
          </Link>
          <Link
            href="/"
            className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            {t.newBill || "New Bill"}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex items-center gap-4 p-4">
          <Field label={t.filterFrom}>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </Field>
          <Field label={t.filterTo}>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </Field>
        </Card>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-2xl">💰</div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">{t.totalRevenue}</p>
                  <p className="text-2xl font-bold text-slate-800">₹{formatCurrency(stats.revenue)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">📥</div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">{t.totalAdvance}</p>
                  <p className="text-2xl font-bold text-slate-800">₹{formatCurrency(stats.advance)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-2xl">📤</div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">{t.totalPending}</p>
                  <p className="text-2xl font-bold text-slate-800">₹{formatCurrency(stats.pending)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl">🧾</div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">{t.totalBills}</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.count}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <SectionHeading title={t.monthlyRevenue} />
              <div className="mt-6 h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip cursor={{ fill: "#f1f5f9" }} formatter={(value) => [`₹${formatCurrency(value)}`, t.totalRevenue]} />
                    <Bar dataKey="revenue" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <SectionHeading title={t.monthlyAdvance} />
              <div className="mt-6 h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip formatter={(value) => [`₹${formatCurrency(value)}`, t.totalAdvance]} />
                    <Line type="monotone" dataKey="advance" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <SectionHeading title={t.recentBills} />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{t.customerName}</th>
                    <th className="px-6 py-4 font-semibold">{t.invoiceNo}</th>
                    <th className="px-6 py-4 font-semibold">{t.date}</th>
                    <th className="px-6 py-4 font-semibold">{t.total}</th>
                    <th className="px-6 py-4 font-semibold">{t.advance}</th>
                    <th className="px-6 py-4 font-semibold">{t.totalPending}</th>
                    <th className="px-6 py-4 font-semibold">{t.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredBills.slice(0, 10).map((bill) => {
                    const status = getStatus(bill);
                    return (
                      <tr key={bill.id} className="transition hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium">{bill.customer_name || "-"}</td>
                        <td className="px-6 py-4">#{bill.invoice_no}</td>
                        <td className="px-6 py-4 text-slate-500">{formatDisplayDate(bill.date)}</td>
                        <td className="px-6 py-4 font-medium">₹{formatCurrency(bill.grand_total)}</td>
                        <td className="px-6 py-4 text-emerald-600">₹{formatCurrency(bill.advance)}</td>
                        <td className="px-6 py-4 text-orange-600">
                          ₹{formatCurrency((bill.grand_total || 0) - (bill.advance || 0))}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.color}`}>
                            {t[status.label.toLowerCase()] || status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredBills.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                        {t.noData}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
