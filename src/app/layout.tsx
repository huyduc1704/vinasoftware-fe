import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App as AntdApp } from 'antd';
import LenisProvider from '@/components/providers/LenisProvider';
import MainLayout from '@/components/layout/MainLayout';
import "./globals.css"; const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vina Software",
  description: "Vina Software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AntdRegistry>
          <AntdApp>
            <LenisProvider>
              <MainLayout>{children}</MainLayout>
            </LenisProvider>
          </AntdApp>
        </AntdRegistry>
      </body>
    </html>
  );
}
