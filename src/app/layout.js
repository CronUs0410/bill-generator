import "./globals.css";

export const metadata = {
  title: "Bill Generator",
  description: "Bilingual bill generator with Supabase sharing and QR payments.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

