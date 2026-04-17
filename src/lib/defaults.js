import { formatDateInput } from "@/lib/formatters";

export const defaultSettings = {
  contact_name1: "Dilip Ramjiyani",
  contact_phone1: "+91 91580 78649",
  contact_name2: "Anuj Ramjiyani",
  contact_phone2: "+91 73856 89102",
  upi_id: "dilipramjiyani4780-1@oksbi",
  upi_name: "Dilip Ramjiyani",
};

export function createEmptyItem(index = 1) {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    description: "",
    qty: "0",
    rate: "0",
  };
}

export function createDefaultBill() {
  return {
    invoiceNo: "",
    date: formatDateInput(),
    customerName: "",
    items: [createEmptyItem()],
    advance: "0",
  };
}

