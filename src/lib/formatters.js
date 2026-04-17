export function toNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value) {
  return toNumber(value).toFixed(2);
}

export function formatDateInput(date = new Date()) {
  return new Date(date).toISOString().split("T")[0];
}

export function formatDisplayDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}-${month}-${year}`;
}

export function buildUpiLink({ upiId, upiName, amount }) {
  const params = new URLSearchParams({
    pa: upiId || "",
    pn: upiName || "",
    am: formatCurrency(amount),
    cu: "INR",
  });

  return `upi://pay?${params.toString()}`;
}

export function normalizeBillForPdf(bill) {
  return {
    ...bill,
    total: formatCurrency(bill.total),
    advance: formatCurrency(bill.advance),
    grandTotal: formatCurrency(bill.grand_total ?? bill.grandTotal),
    items: (bill.items || []).map((item, index) => ({
      ...item,
      srNo: index + 1,
      qty: formatCurrency(item.qty),
      rate: formatCurrency(item.rate),
      amount: formatCurrency(item.amount),
    })),
  };
}

