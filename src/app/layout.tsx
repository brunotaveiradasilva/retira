import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// next/font baixa a fonte no build e serve do próprio site (sem chamar o Google no navegador).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Cada página pode definir só o título dela; o template completa: "Materiais · Retira".
  title: {
    default: "Retira · Almoxarifado",
    template: "%s · Retira",
  },
  description: "Saiba com quem está cada material da sua empresa.",
};

// O layout raiz envolve TODAS as páginas. `children` é a página da rota atual.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
