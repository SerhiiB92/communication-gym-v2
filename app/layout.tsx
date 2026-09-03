import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Тренажер комунікації для менеджерів",
  description: "Текстовий симулятор складних розмов для менеджерів",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
