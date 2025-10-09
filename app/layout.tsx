import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PsicoStacks Backend',
  description: 'Verifiable credentials backend with Next.js App Router',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
