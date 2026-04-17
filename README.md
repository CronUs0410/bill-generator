# Bill Generator

Full-stack bilingual bill generator built with Next.js 14 App Router, Supabase, TailwindCSS, `qrcode.react`, `jspdf`, and `html2canvas`.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

3. Run the SQL in [supabase/schema.sql](/C:/Users/Admin/OneDrive/Documents/New%20project/supabase/schema.sql) inside the Supabase SQL editor.

4. Start development:

```bash
npm run dev
```

## Features

- English and Gujarati UI toggle
- Auto-incrementing invoice number from Supabase
- Dynamic item table with description suggestions
- QR code payment card using UPI
- English-only PDF generation
- Public share links at `/bill/[token]`
- Admin panel at `/admin` with no login
- Mobile-first layout ready for Vercel deployment
