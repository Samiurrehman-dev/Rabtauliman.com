export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-gray-900">Rabta-ul-Iman</h1>
        <p className="text-xl text-gray-600">Village Funding Management System</p>
        <div className="flex gap-4 justify-center mt-8">
          <a
            href="/donor/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Donor Portal
          </a>
          <a
            href="/admin/login"
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            Admin Portal
          </a>
        </div>
      </div>
    </div>
  );
}
