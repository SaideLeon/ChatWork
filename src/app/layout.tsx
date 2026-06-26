import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatWork — Editor de Documentos Word",
  description:
    "Edite documentos Word com IA. Descompacte, edite secções e pré-visualize em tempo real.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
