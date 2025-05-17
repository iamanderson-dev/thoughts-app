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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={poppins.className}>{children}</body>
    </html>
  )
}
