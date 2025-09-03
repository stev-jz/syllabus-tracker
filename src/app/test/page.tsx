export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Test Page Working
        </h1>
        <p className="text-gray-600">
          If you can see this page, the basic Next.js routing is working.
        </p>
        <div className="mt-4 p-4 bg-green-100 border border-green-200 rounded">
          <p className="text-green-800 text-sm">
            ✅ Next.js App Router is functioning
          </p>
          <p className="text-green-800 text-sm">
            ✅ Tailwind CSS is loading
          </p>
        </div>
      </div>
    </div>
  )
}
