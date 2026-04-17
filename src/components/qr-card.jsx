"use client";

import { QRCodeSVG } from "qrcode.react";

import { Card, SectionHeading } from "@/components/ui";
import { buildUpiLink, formatCurrency } from "@/lib/formatters";

export function QrCard({ title, subtitle, settings, grandTotal }) {
  const upiLink = buildUpiLink({
    upiId: settings.upi_id,
    upiName: settings.upi_name,
    amount: grandTotal,
  });

  return (
    <Card className="overflow-hidden">
      <SectionHeading title={title} subtitle={subtitle} />
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex justify-center rounded-3xl bg-slate-50 p-4">
          <QRCodeSVG value={upiLink} size={210} includeMargin />
        </div>
        <div className="rounded-2xl bg-brand p-4 text-white">
          <p className="text-sm opacity-80">UPI ID</p>
          <p className="mt-1 break-all font-semibold">{settings.upi_id}</p>
          <p className="mt-3 text-sm opacity-80">Payee</p>
          <p className="mt-1 font-semibold">{settings.upi_name}</p>
          <p className="mt-3 text-sm opacity-80">Amount</p>
          <p className="mt-1 text-2xl font-bold">Rs. {formatCurrency(grandTotal)}</p>
        </div>
      </div>
    </Card>
  );
}

