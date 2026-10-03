import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "OPTIQIS Optical Lenswear Vietnam",
    template: "%s | OPTIQIS",
  },
  description:
    "Nen tang giao duc thi luc, cong nghe trong kinh va ket noi 450+ phong kham/doi tac khuc xa OPTIQIS.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={plusJakarta.variable}>{children}</body>
    </html>
  );
}
