import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "e-Fatura XML Görüntüleyici",
  description: "UBL-TR e-Fatura XML dosyalarını gömülü XSLT şablonuyla güvenli biçimde görüntüleyin.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
