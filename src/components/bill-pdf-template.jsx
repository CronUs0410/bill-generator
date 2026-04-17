"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

import { defaultSettings } from "@/lib/defaults";
import { buildUpiLink, formatCurrency, formatDisplayDate } from "@/lib/formatters";

export function BillPdfTemplate({ bill, settings = defaultSettings }) {
  const qrRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const upiLink = buildUpiLink({
    upiId: settings.upi_id,
    upiName: settings.upi_name,
    amount: bill.grand_total,
  });

  // Convert QR canvas to base64 image so html2canvas can capture it in PDF
  useEffect(() => {
    const timer = setTimeout(() => {
      if (qrRef.current) {
        const canvas = qrRef.current.querySelector("canvas");
        if (canvas) {
          setQrDataUrl(canvas.toDataURL("image/png"));
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [upiLink]);

  return (
    <div
      id="bill-pdf-template"
      className="w-[794px] bg-white p-10 font-sans text-[14px] text-black"
    >
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoice</h1>
          <p className="mt-2">Customer: {bill.customer_name || "-"}</p>
        </div>
        <div className="text-right">
          <p>Date: {formatDisplayDate(bill.date)}</p>
          <p>Invoice No: {bill.invoice_no}</p>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-t border-black">
            <th className="px-2 py-2 text-left">Sr No</th>
            <th className="px-2 py-2 text-left">Description</th>
            <th className="px-2 py-2 text-right">Qty</th>
            <th className="px-2 py-2 text-right">Rate</th>
            <th className="px-2 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item) => (
            <tr key={`${item.srNo}-${item.description}`} className="border-b border-slate-200">
              <td className="px-2 py-2">{item.srNo}</td>
              <td className="px-2 py-2">{item.description || "-"}</td>
              <td className="px-2 py-2 text-right">{formatCurrency(item.qty)}</td>
              <td className="px-2 py-2 text-right">{formatCurrency(item.rate)}</td>
              <td className="px-2 py-2 text-right">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-8 w-[280px] space-y-2 text-right">
        <p>
          <span className="font-semibold">TOTAL:</span> {formatCurrency(bill.total)}
        </p>
        <p>
          <span className="font-semibold">ADVANCE:</span> {formatCurrency(bill.advance)}
        </p>
        <p className="text-lg font-bold">
          <span>GRAND TOTAL:</span> {formatCurrency(bill.grand_total)}
        </p>
      </div>

      {/* QR Code Section for PDF */}
      <div className="mt-10 flex items-end justify-between border-t border-slate-300 pt-6">
        <div className="space-y-1 text-sm">
          <p>
            {settings.contact_name1}: {settings.contact_phone1}
          </p>
          <p>
            {settings.contact_name2}: {settings.contact_phone2}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            UPI: {settings.upi_id} ({settings.upi_name})
          </p>
        </div>
        <div className="text-center">
          <p className="mb-2 text-xs font-semibold">Scan to Pay</p>
          {/* Hidden QRCodeCanvas used to generate base64 */}
          <div ref={qrRef} style={{ position: "absolute", left: "-9999px", opacity: 0 }}>
            <QRCodeCanvas value={upiLink} size={140} />
          </div>
          {/* Rendered as <img> so html2canvas can capture it */}
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Payment QR Code" width={140} height={140} />
          ) : (
            <div style={{ width: 140, height: 140, background: "#f0f0f0" }} />
          )}
        </div>
      </div>
    </div>
  );
}
