export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          PsicoStacks Backend
        </h1>
        <div className="text-center space-y-4">
          <p className="text-lg">
            Next.js 14 backend with App Router and API routes
          </p>
          <div className="mt-8 space-y-2">
            <p className="font-semibold">Available API Endpoints:</p>
            <ul className="space-y-1 text-sm">
              <li>POST /api/ai-interpret</li>
              <li>POST /api/credentials</li>
              <li>POST /api/share</li>
              <li>POST /api/verify/pay</li>
              <li>GET /api/verify/view</li>
            </ul>
          </div>
          <div className="mt-8 pt-8 border-t">
            <p className="text-xs text-gray-600">
              Verifiable credentials with encryption and blockchain integration
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
