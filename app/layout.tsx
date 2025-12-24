import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Manipulation Factory',
  description: 'Interactive Prebunking Experience',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  )
}

