import type { Metadata } from "next";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";

export const metadata: Metadata = {
  title: "Lolaum",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body suppressHydrationWarning>
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
