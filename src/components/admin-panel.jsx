"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button, Card, Field, Input, SectionHeading } from "@/components/ui";
import { defaultSettings } from "@/lib/defaults";
import { formatCurrency } from "@/lib/formatters";
import { collection, doc, getDocs, query, orderBy, setDoc, addDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { translations } from "@/lib/translations";

const ADMIN_PASSWORD = "1007";

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [lang, setLang] = useState("en");
  const [settings, setSettings] = useState(defaultSettings);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [bills, setBills] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [suggestionForm, setSuggestionForm] = useState({
    description: "",
    default_rate: "",
  });

  const t = translations[lang];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [settingsSnap, suggestionsSnap, billsSnap] = await Promise.all([
        getDocs(collection(db, "settings")),
        getDocs(query(collection(db, "suggestions"), orderBy("description"))),
        getDocs(query(collection(db, "bills"), orderBy("created_at", "desc"))),
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

      const bls = [];
      billsSnap.forEach((doc) => {
        bls.push({ id: doc.id, ...doc.data() });
      });
      setBills(bls);
    } catch (error) {
      console.error(error);
    }
  }

  async function saveSettings() {
    try {
      const batch = writeBatch(db);
      Object.entries(settings).forEach(([key, value]) => {
        const docRef = doc(db, "settings", key);
        batch.set(docRef, { value });
      });
      await batch.commit();
      setSettingsMessage(t.settingsSaved);
    } catch (error) {
      setSettingsMessage(error.message);
    }
  }

  async function saveSuggestion() {
    const payload = {
      description: suggestionForm.description.trim(),
      default_rate:
        suggestionForm.default_rate === "" ? null : Number.parseFloat(suggestionForm.default_rate),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "suggestions", editingId), payload);
      } else {
        await addDoc(collection(db, "suggestions"), payload);
      }
      setSuggestionForm({ description: "", default_rate: "" });
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error("Failed to save suggestion", error);
    }
  }

  async function deleteSuggestion(id) {
    try {
      await deleteDoc(doc(db, "suggestions", id));
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  async function deleteBill(id) {
    try {
      await deleteDoc(doc(db, "bills", id));
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  async function markAsPaid(bill) {
    try {
      await updateDoc(doc(db, "bills", bill.id), { advance: bill.grand_total });
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  async function markAsUnpaid(bill) {
    try {
      await updateDoc(doc(db, "bills", bill.id), { advance: 0 });
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  function startEditSuggestion(entry) {
    setEditingId(entry.id);
    setSuggestionForm({
      description: entry.description,
      default_rate: entry.default_rate ?? "",
    });
  }

  function handlePasswordSubmit(e) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password");
    }
  }

  // Password gate — show prompt before admin panel access
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md overflow-hidden">
          <SectionHeading
            title={t.adminTitle}
            subtitle="Enter password to access admin panel."
          />
          <form onSubmit={handlePasswordSubmit} className="space-y-4 p-5 sm:p-6">
            <Field label="Password">
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                autoFocus
              />
            </Field>
            {passwordError && (
              <p className="text-sm font-semibold text-red-500">{passwordError}</p>
            )}
            <div className="flex items-center gap-3">
              <Button type="submit">Unlock Admin Panel</Button>
              <Link
                href="/"
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                {t.backHome}
              </Link>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-brand px-5 py-6 text-white shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-3xl font-bold">{t.adminTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200">{t.adminSubtitle}</p>
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
            href="/dashboard"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand transition hover:bg-slate-100"
          >
            {t.dashboard}
          </Link>
          <Link
            href="/"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand transition hover:bg-slate-100"
          >
            {t.backHome}
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        <SectionHeading title={t.contactSettings} />
        <div className="grid gap-4 p-5 md:grid-cols-2 sm:p-6">
          {[
            ["contact_name1", t.name1],
            ["contact_phone1", t.phone1],
            ["contact_name2", t.name2],
            ["contact_phone2", t.phone2],
            ["upi_id", t.upiId],
            ["upi_name", t.upiName],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <Input
                value={settings[key]}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, [key]: event.target.value }))
                }
              />
            </Field>
          ))}
        </div>
        <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
          <Button type="button" onClick={saveSettings}>
            {t.saveSettings}
          </Button>
          {settingsMessage ? <p className="mt-3 text-sm text-brand">{settingsMessage}</p> : null}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <SectionHeading title={t.suggestionsManager} />
        <div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-[minmax(0,1fr)_180px_auto] sm:p-6">
          <Field label={t.description}>
            <Input
              placeholder={t.suggestionPlaceholder}
              value={suggestionForm.description}
              onChange={(event) =>
                setSuggestionForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </Field>
          <Field label={t.defaultRate}>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder={t.defaultRatePlaceholder}
              value={suggestionForm.default_rate}
              onChange={(event) =>
                setSuggestionForm((current) => ({
                  ...current,
                  default_rate: event.target.value,
                }))
              }
            />
          </Field>
          <div className="flex items-end gap-3">
            <Button type="button" onClick={saveSuggestion}>
              {editingId ? t.update : t.addSuggestion}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setSuggestionForm({ description: "", default_rate: "" });
                }}
              >
                {t.cancel}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto p-5 sm:p-6">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left">{t.description}</th>
                <th className="px-4 py-3 text-left">{t.defaultRate}</th>
                <th className="px-4 py-3 text-left">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.length ? (
                suggestions.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{entry.description}</td>
                    <td className="px-4 py-3">{formatCurrency(entry.default_rate)}</td>
                    <td className="flex gap-2 px-4 py-3">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => startEditSuggestion(entry)}
                      >
                        {t.edit}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => deleteSuggestion(entry.id)}
                      >
                        {t.delete}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={3}>
                    {t.noSuggestions}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <SectionHeading title={t.savedBills} />
        <div className="overflow-x-auto p-5 sm:p-6">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left">{t.invoiceNo}</th>
                <th className="px-4 py-3 text-left">{t.customerName}</th>
                <th className="px-4 py-3 text-left">{t.grandTotal}</th>
                <th className="px-4 py-3 text-left">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {bills.length ? (
                bills.map((bill) => (
                  <tr key={bill.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{bill.invoice_no}</td>
                    <td className="px-4 py-3">{bill.customer_name || "-"}</td>
                    <td className="px-4 py-3">{formatCurrency(bill.grand_total)}</td>
                    <td className="flex flex-wrap gap-2 px-4 py-3">
                      <select
                        className={`cursor-pointer rounded-2xl border-none px-4 py-2 text-sm font-semibold outline-none transition ${
                          bill.advance >= bill.grand_total
                            ? "bg-emerald-100 text-emerald-800"
                            : bill.advance > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                        }`}
                        value={
                          bill.advance >= bill.grand_total
                            ? "paid"
                            : bill.advance > 0
                              ? "partial"
                              : "unpaid"
                        }
                        onChange={(e) => {
                          if (e.target.value === "paid") {
                            markAsPaid(bill);
                          } else if (e.target.value === "unpaid") {
                            markAsUnpaid(bill);
                          }
                        }}
                      >
                        <option value="paid">{t.paid}</option>
                        {bill.advance > 0 && bill.advance < bill.grand_total && (
                          <option value="partial" disabled>
                            {t.partial}
                          </option>
                        )}
                        <option value="unpaid">{t.unpaid}</option>
                      </select>
                      <Link
                        href={`/bill/${bill.token}`}
                        target="_blank"
                        className="rounded-2xl bg-slate-100 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-200"
                      >
                        {t.viewBill}
                      </Link>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => deleteBill(bill.id)}
                      >
                        {t.delete}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={4}>
                    {t.noBills}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

