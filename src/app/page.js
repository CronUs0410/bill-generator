"use client";

import { useState } from "react";
import { BillForm } from "@/components/bill-form";
import { Button, Card, Field, Input, SectionHeading } from "@/components/ui";

const APP_PASSWORD = "1007";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function handlePasswordSubmit(e) {
    e.preventDefault();
    if (password === APP_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password");
    }
  }

  // Password gate — show prompt before home page access
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md overflow-hidden">
          <SectionHeading
            title="Bill Generator"
            subtitle="Enter password to generate bills."
          />
          <form onSubmit={handlePasswordSubmit} className="space-y-4 p-5 sm:p-6">
            <Field label="Password">
              <Input
                type="password"
                placeholder="Enter password"
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
              <Button type="submit">Unlock Bill Generator</Button>
            </div>
          </form>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[32px] bg-brand px-5 py-8 text-white shadow-card sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_320px] lg:items-end">
            <div>
              <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-100">
                Developed by
                ANUJ RAMJIYANI
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Bill Generator
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-200 sm:text-lg">
                Build bills fast, keep QR payment ready, and share public invoice links without
                login.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["Mobile-first", "Large touch targets and scroll-safe tables."],
                ["Shareable", "Public token links powered by Firebase."],
                ["Printable", "English-only PDF output with clean totals."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-slate-200">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <BillForm />
      </div>
    </main>
  );
}

