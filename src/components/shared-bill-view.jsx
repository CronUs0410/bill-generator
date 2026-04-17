"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { collection, doc, getDoc, getDocs } from "firebase/firestore";

import { FooterCard } from "@/components/footer-card";
import { QrCard } from "@/components/qr-card";
import { Card, SectionHeading } from "@/components/ui";
import { BillPdfTemplate } from "@/components/bill-pdf-template";
import { defaultSettings } from "@/lib/defaults";
import { formatCurrency, formatDisplayDate } from "@/lib/formatters";
import { db } from "@/lib/firebase";
import { translations } from "@/lib/translations";

export function SharedBillView({ token }) {
  const [lang, setLang] = useState("en");
  const [bill, setBill] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const pdfRef = useRef(null);
  const t = translations[lang];

  useEffect(() => {
    async function loadBill() {
      setLoading(true);
      
      try {
        const [settingsSnap, billSnap] = await Promise.all([
          getDocs(collection(db, "settings")),
          getDoc(doc(db, "bills", token)),
        ]);

        const incoming = {};
        settingsSnap.forEach((doc) => {
          incoming[doc.id] = doc.data().value;
        });
        setSettings((current) => ({ ...current, ...incoming }));

        if (billSnap.exists()) {
          setBill({ id: billSnap.id, ...billSnap.data() });
        }
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    }

    loadBill();
  }, [token]);

  async function handleDownloadPdf() {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const canvas = await html2canvas(pdfRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (canvas.height * pageWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
    pdf.save(`invoice-${bill?.invoice_no || "bill"}.pdf`);
  }

  const grandTotal = useMemo(() => bill?.grand_total ?? 0, [bill]);

  if (loading) {
    return <p className="py-20 text-center text-sm text-slate-500">{t.loading}</p>;
  }

  if (!bill) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center shadow-lg">
          <p className="text-2xl font-bold text-red-500">Bill not found</p>
          <p className="mt-2 text-slate-500">The link you followed is invalid or has been deleted.</p>
          <Link href="/" className="mt-6 inline-block rounded-2xl bg-brand px-6 py-3 font-semibold text-white">
            Go to Home
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-brand px-5 py-6 text-white shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-3xl font-bold">{t.billViewerTitle}</h1>
          <p className="mt-2 text-sm text-slate-200">
            {bill.customer_name || "-"} | {formatDisplayDate(bill.date)} | #{bill.invoice_no}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setLang((current) => (current === "en" ? "gu" : "en"))}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
          >
            EN | ગુ
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand transition hover:bg-slate-100"
          >
            {t.downloadPdf}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_380px]">
        <Card className="overflow-hidden">
          <SectionHeading title={t.billViewerTitle} subtitle={t.mobileHint} />
          <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-3 sm:p-6">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t.customerName}</p>
              <p className="mt-2 font-semibold text-brand">{bill.customer_name || "-"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t.date}</p>
              <p className="mt-2 font-semibold text-brand">{formatDisplayDate(bill.date)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t.invoiceNo}</p>
              <p className="mt-2 font-semibold text-brand">{bill.invoice_no}</p>
            </div>
          </div>
          <div className="overflow-x-auto p-5 sm:p-6">
            <table className="min-w-full text-sm">
              <thead className="bg-brand text-white">
                <tr>
                  <th className="px-4 py-3 text-left">{t.srNo}</th>
                  <th className="px-4 py-3 text-left">{t.description}</th>
                  <th className="px-4 py-3 text-left">{t.qty}</th>
                  <th className="px-4 py-3 text-left">{t.rate}</th>
                  <th className="px-4 py-3 text-left">{t.amount}</th>
                </tr>
              </thead>
              <tbody>
                {(bill.items || []).map((item, index) => (
                  <tr key={`${index}-${item.description}`} className="border-t border-slate-100">
                    <td className="px-4 py-3">{item.srNo || index + 1}</td>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3">{formatCurrency(item.qty)}</td>
                    <td className="px-4 py-3">{formatCurrency(item.rate)}</td>
                    <td className="px-4 py-3">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 border-t border-slate-100 bg-slate-50 px-5 py-5 text-sm sm:px-6">
            <div className="flex items-center justify-between">
              <span>{t.total}</span>
              <span className="font-semibold">Rs. {formatCurrency(bill.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t.advance}</span>
              <span className="font-semibold">Rs. {formatCurrency(bill.advance)}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-bold text-brand">
              <span>{t.grandTotal}</span>
              <span>Rs. {formatCurrency(bill.grand_total)}</span>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <QrCard
            title={t.qrTitle}
            subtitle={t.qrSubtitle}
            settings={settings}
            grandTotal={grandTotal}
          />
          <FooterCard title={t.footerTitle} settings={settings} />
        </div>
      </div>

      <div className="pointer-events-none fixed left-[-9999px] top-0 opacity-0">
        <div ref={pdfRef}>
          <BillPdfTemplate bill={bill} settings={settings} />
        </div>
      </div>
    </div>
  );
}

