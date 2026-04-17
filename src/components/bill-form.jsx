"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { BillPdfTemplate } from "@/components/bill-pdf-template";
import { FooterCard } from "@/components/footer-card";
import { QrCard } from "@/components/qr-card";
import { Button, Card, Field, Input, SectionHeading } from "@/components/ui";
import { computeTotals, ensureAtLeastOneItem, prepareBillPayload } from "@/lib/bill-utils";
import { createDefaultBill, createEmptyItem, defaultSettings } from "@/lib/defaults";
import { formatCurrency } from "@/lib/formatters";
import { collection, doc, getDocs, query, orderBy, limit, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { translations } from "@/lib/translations";

export function BillForm() {
  const [lang, setLang] = useState("en");
  const [formState, setFormState] = useState(createDefaultBill());
  const [settings, setSettings] = useState(defaultSettings);
  const [suggestions, setSuggestions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [message, setMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [currentBillId, setCurrentBillId] = useState(null);
  const pdfRef = useRef(null);

  const t = translations[lang];

  const totals = useMemo(
    () => computeTotals(formState.items, formState.advance),
    [formState.items, formState.advance],
  );

  const shareableBill = useMemo(
    () => ({
      customer_name: formState.customerName,
      invoice_no: formState.invoiceNo,
      date: formState.date,
      items: totals.items,
      total: totals.total,
      advance: totals.advance,
      grand_total: totals.grandTotal,
    }),
    [formState, totals],
  );

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);

      try {
        const [settingsSnap, suggestionsSnap, billsSnap, customersSnap] = await Promise.all([
          getDocs(collection(db, "settings")),
          getDocs(query(collection(db, "suggestions"), orderBy("description"))),
          getDocs(query(collection(db, "bills"), orderBy("created_at", "desc"), limit(1))),
          getDocs(query(collection(db, "customers"), orderBy("name")))
        ]);

        const incoming = {};
        settingsSnap.forEach((doc) => {
          incoming[doc.id] = doc.data().value;
        });
        if (Object.keys(incoming).length > 0) {
          setSettings((current) => ({ ...current, ...incoming }));
        }

        const sugs = [];
        suggestionsSnap.forEach((doc) => {
          sugs.push({ id: doc.id, ...doc.data() });
        });
        setSuggestions(sugs);

        const custs = [];
        customersSnap.forEach((doc) => {
          custs.push({ id: doc.id, ...doc.data() });
        });
        setCustomers(custs);

        let lastInvoice = 0;
        billsSnap.forEach((doc) => {
          lastInvoice = doc.data().invoice_no;
        });
        const nextInvoice = (lastInvoice || 0) + 1;
        setFormState((current) => ({ ...current, invoiceNo: String(nextInvoice) }));
      } catch (error) {
        console.error(error);
      }
      
      setLoading(false);
    }

    loadInitialData();
  }, []);

  function updateItem(itemId, key, value) {
    setFormState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function applySuggestion(itemId, description) {
    const matched = suggestions.find((entry) => entry.description === description);
    setFormState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              description,
              rate:
                matched && matched.default_rate !== null
                  ? String(matched.default_rate)
                  : item.rate,
            }
          : item,
      ),
    }));
  }

  function handleAddSuggestionToBill(suggestion) {
    setFormState((current) => {
      // Find if we have exactly one empty row at the very beginning
      const isFirstEmpty =
        current.items.length === 1 &&
        !current.items[0].description &&
        (!current.items[0].rate || current.items[0].rate === "0" || current.items[0].rate === "") &&
        (!current.items[0].qty || current.items[0].qty === "0" || current.items[0].qty === "");

      const rate = suggestion.default_rate !== null && suggestion.default_rate !== undefined ? String(suggestion.default_rate) : "0";

      if (isFirstEmpty) {
        return {
          ...current,
          items: [{
            ...current.items[0],
            description: suggestion.description,
            rate: rate,
            qty: "1",
          }],
        };
      }

      return {
        ...current,
        items: [
          ...current.items,
          {
            ...createEmptyItem(current.items.length + 1),
            description: suggestion.description,
            rate: rate,
            qty: "1",
          }
        ],
      };
    });
  }

  function addRow() {
    setFormState((current) => ({
      ...current,
      items: [...current.items, createEmptyItem(current.items.length + 1)],
    }));
  }

  function removeRow(itemId) {
    setFormState((current) => ({
      ...current,
      items: ensureAtLeastOneItem(current.items.filter((item) => item.id !== itemId)),
    }));
  }

  async function handleDownloadPdf() {
    // Wait for QR code base64 image to render in the PDF template
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
    pdf.save(`invoice-${formState.invoiceNo || "bill"}.pdf`);
  }

  async function handleSaveBill() {
    try {
      setSharing(true);
      const payload = prepareBillPayload(formState);
      const token = currentBillId || crypto.randomUUID();
      
      await setDoc(doc(db, "bills", token), {
        ...payload,
        token,
        updated_at: serverTimestamp(),
        ...(currentBillId ? {} : { created_at: serverTimestamp() }),
      }, { merge: true });

      if (payload.customer_name) {
        await setDoc(doc(db, "customers", payload.customer_name), {
          name: payload.customer_name,
        }, { merge: true });
      }

      setMessage(t.saveSuccess);
      setShareUrl("");
      if (!currentBillId) {
        setCurrentBillId(token);
      }
    } catch (error) {
      setMessage(error.message || t.error);
    } finally {
      setSharing(false);
    }
  }

  async function handleShareBill() {
    try {
      setSharing(true);
      const payload = prepareBillPayload(formState);
      const token = currentBillId || crypto.randomUUID();
      
      await setDoc(doc(db, "bills", token), {
        ...payload,
        token,
        updated_at: serverTimestamp(),
        ...(currentBillId ? {} : { created_at: serverTimestamp() }),
      }, { merge: true });

      if (payload.customer_name) {
        await setDoc(doc(db, "customers", payload.customer_name), {
          name: payload.customer_name,
        }, { merge: true });
      }

      const url = `${window.location.origin}/bill/${token}`;
      setShareUrl(url);
      setMessage(t.shareSuccess);
      if (!currentBillId) {
        setCurrentBillId(token);
      }
    } catch (error) {
      setMessage(error.message || t.error);
    } finally {
      setSharing(false);
    }
  }

  function handleNewBill() {
    setFormState((current) => ({
      ...createDefaultBill(),
      invoiceNo: String((Number.parseInt(current.invoiceNo, 10) || 0) + 1),
    }));
    setCurrentBillId(null);
    setShareUrl("");
    setMessage("");
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setMessage("Link copied.");
  }

  if (loading) {
    return <p className="py-20 text-center text-sm text-slate-500">{t.loading}</p>;
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_380px]">
        <Card className="overflow-hidden">
          <SectionHeading
            title={t.mainCardTitle}
            subtitle={t.mainCardSubtitle}
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLang((current) => (current === "en" ? "gu" : "en"))}
                  className="rounded-full border border-brand/10 bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  EN | ગુ
                </button>
                <Link
                  href="/admin"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-brand transition hover:border-brand/20 hover:bg-brand/5"
                >
                  {t.adminPanel}
                </Link>
              </div>
            }
          />

          <div className="space-y-6 p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label={t.invoiceNo} hint={t.invoiceHelp}>
                <Input
                  value={formState.invoiceNo}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, invoiceNo: event.target.value }))
                  }
                />
              </Field>
              <Field label={t.date}>
                <Input
                  type="date"
                  value={formState.date}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, date: event.target.value }))
                  }
                />
              </Field>
              <Field label={t.customerName}>
                <Input
                  list="customer-suggestions"
                  placeholder={t.customerPlaceholder}
                  value={formState.customerName}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      customerName: event.target.value,
                    }))
                  }
                />
                <datalist id="customer-suggestions">
                  {customers.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </Field>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between px-4 py-4">
                <div>
                  <h3 className="text-base font-semibold text-brand">{t.newBill}</h3>
                  <p className="mt-1 text-xs text-slate-500">{t.mobileHint}</p>
                </div>
                <Button type="button" onClick={addRow}>
                  {t.addRow}
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-brand text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">{t.srNo}</th>
                      <th className="px-4 py-3 text-left">{t.description}</th>
                      <th className="px-4 py-3 text-left">{t.qty}</th>
                      <th className="px-4 py-3 text-left">{t.rate}</th>
                      <th className="px-4 py-3 text-left">{t.amount}</th>
                      <th className="px-4 py-3 text-left">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formState.items.map((item, index) => {
                      const computed = totals.items[index];
                      return (
                        <tr key={item.id} className="border-t border-slate-200 bg-white">
                          <td className="px-4 py-3 font-semibold text-slate-600">{index + 1}</td>
                          <td className="min-w-[220px] px-4 py-3">
                            <Input
                              list={`description-suggestions-${index}`}
                              placeholder={t.descriptionPlaceholder}
                              value={item.description}
                              onChange={(event) =>
                                applySuggestion(item.id, event.target.value)
                              }
                            />
                            <datalist id={`description-suggestions-${index}`}>
                              {suggestions.map((entry) => (
                                <option key={entry.id} value={entry.description} />
                              ))}
                            </datalist>
                          </td>
                          <td className="min-w-[120px] px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.qty}
                              onChange={(event) =>
                                updateItem(item.id, "qty", event.target.value)
                              }
                            />
                          </td>
                          <td className="min-w-[120px] px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(event) =>
                                updateItem(item.id, "rate", event.target.value)
                              }
                            />
                          </td>
                          <td className="min-w-[140px] px-4 py-3 font-semibold text-brand">
                            {formatCurrency(computed?.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => removeRow(item.id)}
                            >
                              {t.remove}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-brand">{t.suggestionsTitle}</p>
                <p className="mt-1 text-sm text-slate-500 mb-4">{t.suggestionsSubtitle}</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.length === 0 ? (
                    <p className="text-sm text-slate-400">No suggestions yet. Add from Admin Panel.</p>
                  ) : (
                    suggestions.map((sug) => (
                      <button
                        key={sug.id}
                        type="button"
                        onClick={() => handleAddSuggestionToBill(sug)}
                        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand hover:bg-brand/5 hover:text-brand"
                      >
                        {sug.description}
                        {sug.default_rate ? <span className="text-xs opacity-60">₹{sug.default_rate}</span> : null}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl bg-brand p-5 text-white">
                <div className="space-y-4">
                  <Field label={t.advance} labelClassName="text-white">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formState.advance}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          advance: event.target.value,
                        }))
                      }
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/60 focus:bg-white focus:text-black focus:placeholder:text-slate-500"
                    />
                  </Field>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>{t.total}</span>
                      <span className="font-semibold">Rs. {formatCurrency(totals.total)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t.advance}</span>
                      <span className="font-semibold">Rs. {formatCurrency(totals.advance)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/15 pt-2 text-lg font-bold">
                      <span>{t.grandTotal}</span>
                      <span>Rs. {formatCurrency(totals.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row flex-wrap">
              <Button type="button" className="sm:min-w-[160px]" onClick={handleDownloadPdf}>
                {t.downloadPdf}
              </Button>
              <Button
                type="button"
                className="sm:min-w-[160px]"
                onClick={handleSaveBill}
                disabled={sharing}
              >
                {t.saveBill}
              </Button>
              <Button
                type="button"
                className="sm:min-w-[160px]"
                onClick={handleShareBill}
                disabled={sharing}
              >
                {sharing ? t.sharing : t.shareBill}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="sm:min-w-[160px]"
                onClick={handleNewBill}
              >
                + {t.newBill}
              </Button>
              {shareUrl ? (
                <Button type="button" variant="secondary" onClick={copyLink}>
                  {t.copyLink}
                </Button>
              ) : null}
            </div>

            {message ? <p className="text-sm text-brand">{message}</p> : null}
            {shareUrl ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-semibold">{t.sharedLink}</p>
                <a href={shareUrl} className="mt-2 block break-all underline" target="_blank">
                  {shareUrl}
                </a>
                <p className="mt-2 text-emerald-700">{t.shareHint}</p>
              </div>
            ) : null}
          </div>
        </Card>

        <div className="space-y-6">
          <QrCard
            title={t.qrTitle}
            subtitle={t.qrSubtitle}
            settings={settings}
            grandTotal={totals.grandTotal}
          />
          <FooterCard title={t.footerTitle} settings={settings} />
        </div>
      </div>

      <div className="pointer-events-none fixed left-[-9999px] top-0 opacity-0">
        <div ref={pdfRef}>
          <BillPdfTemplate bill={shareableBill} settings={settings} />
        </div>
      </div>
    </>
  );
}

