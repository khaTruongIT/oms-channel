import type { Metadata } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Omni-Channel OMS",
  description: "Multi-channel Order Management System",
};

import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdConfigProvider from "@/components/providers/AntdConfigProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${firaSans.variable} ${firaCode.variable} font-body antialiased`}
      >
        <AntdRegistry>
          <AntdConfigProvider>{children}</AntdConfigProvider>
        </AntdRegistry>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
