import { createEmptyItem } from "@/lib/defaults";
import { toNumber } from "@/lib/formatters";

export function computeItems(items = []) {
  return items.map((item, index) => {
    const qty = toNumber(item.qty);
    const rate = toNumber(item.rate);
    const amount = qty * rate;

    return {
      ...item,
      srNo: index + 1,
      qty,
      rate,
      amount,
    };
  });
}

export function computeTotals(items, advance) {
  const normalizedItems = computeItems(items);
  const total = normalizedItems.reduce((sum, item) => sum + item.amount, 0);
  const advanceValue = toNumber(advance);
  const grandTotal = Math.max(total - advanceValue, 0);

  return {
    items: normalizedItems,
    total,
    advance: advanceValue,
    grandTotal,
  };
}

export function prepareBillPayload(formState) {
  const totals = computeTotals(formState.items, formState.advance);

  return {
    customer_name: formState.customerName.trim(),
    invoice_no: Number.parseInt(formState.invoiceNo, 10) || 1,
    date: formState.date,
    items: totals.items.map(({ srNo, description, qty, rate, amount }) => ({
      srNo,
      description: description.trim(),
      qty,
      rate,
      amount,
    })),
    total: totals.total,
    advance: totals.advance,
    grand_total: totals.grandTotal,
  };
}

export function ensureAtLeastOneItem(items) {
  return items.length ? items : [createEmptyItem()];
}

