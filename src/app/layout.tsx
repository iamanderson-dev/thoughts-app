// app/layout.tsx
import './global.css'
import { Poppins } from 'next/font/google'
import type { Metadata } from 'next'

const poppins = Poppins({
  weight: ['400', '700'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Thoughts — Pure Ideas, Shared Simply',
  description: 'A space to share and follow pure thoughts. No media. No replies. Just ideas.',
  icons: {
    icon: '/my-logo.png', // Or '/favicon.ico', or '/icon.svg', etc.
    // You can also add other icon types if needed:
    // apple: '/apple-touch-icon.png',
    // shortcut: '/shortcut-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={poppins.className}>{children}</body>
    </html>
  )
}