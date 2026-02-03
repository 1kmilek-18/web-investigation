import type { Metadata } from 'next';
import '@/app/globals.css';
import { Nav } from '@/components/layout/nav';

export const metadata: Metadata = {
  title: 'Web Investigation - 生産技術×デジタル',
  description: '技術情報のWebスリーピング・要約・メール配信',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <Nav />
        <main className="container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
