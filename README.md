# Bill Generator

Full-stack bilingual bill generator built with Next.js 14 App Router, Firebase, TailwindCSS, Recharts, `qrcode.react`, `jspdf`, and `html2canvas`.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start development:

```bash
npm run dev
```

*(Note: Firebase config is pre-configured directly in the `src/lib/firebase.js` file)*

## Features

- English and Gujarati UI toggle
- Admin Analytics Dashboard with real-time Firestore charts (Recharts)
- Auto-incrementing invoice number from Firebase
- Dynamic item table with description suggestions (auto-saves customers & suggestions to Firebase)
- Mark Bills as Paid / Unpaid dynamically from Admin Panel
- QR code payment card using live UPI links
- English-only high quality PDF downloads
- Password-protected Home UI and Admin interface
- Public share links at `/bill/[token]`
- Mobile-first layout ready for deployment
