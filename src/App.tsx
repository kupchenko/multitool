import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import PdfConverter from "./pages/PdfConverter/PdfConverter";
import PdfCompressor from "./pages/PdfCompressor/PdfCompressor";
import PasswordGenerator from "./pages/PasswordGenerator/PasswordGenerator";
import ProtectedRoute from "./components/ProtectedRoute";

const Navigation: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, logout, user, loginWithRedirect } = useAuth0();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              to="/"
              className="flex items-center px-2 text-2xl font-bold text-gray-900"
            >
              🛠️ MultiTool
            </Link>
            <div className="ml-6 flex space-x-4">
              {isAuthenticated && (
                <>
                  <Link
                    to="/pdf-converter"
                    className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                      location.pathname === "/pdf-converter"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    PDF Converter
                  </Link>
                  <Link
                    to="/pdf-compressor"
                    className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                      location.pathname === "/pdf-compressor"
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    PDF Compressor
                  </Link>
                </>
              )}
              <Link
                to="/password-generator"
                className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                  location.pathname === "/password-generator"
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Password Generator
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 hidden sm:block">
                    {user?.name || user?.email}
                  </span>
                </div>
                <button
                  onClick={() =>
                    logout({
                      logoutParams: {
                        returnTo: "/",
                      },
                    })
                  }
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => loginWithRedirect()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() =>
                    loginWithRedirect({
                      authorizationParams: { screen_hint: "signup" },
                    })
                  }
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const HomePage: React.FC = () => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Welcome to MultiTool
          </h1>
          <p className="text-xl text-gray-600">
            Your all-in-one web utility suite
          </p>
        </div>

        <div
          className={`grid md:grid-cols-3 gap-8 ${
            isAuthenticated ? "md:items-stretch" : ""
          }`}
        >
          {/* Password Generator Card - Always active, shown first */}
          <Link
            to="/password-generator"
            className={`bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 ${
              isAuthenticated ? "flex flex-col w-full" : ""
            }`}
          >
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-xl mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Password Generator
            </h2>
            <p
              className={`text-gray-600 mb-4 ${
                isAuthenticated ? "flex-grow" : ""
              }`}
            >
              Generate strong, secure passwords with customizable options. Keep
              your accounts safe with unique passwords.
            </p>
            <div className="flex items-center text-red-600 font-medium">
              Generate Password
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {/* PDF Converter Card */}
          <div className={`relative ${isAuthenticated ? "flex" : ""}`}>
            {!isAuthenticated && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  loginWithRedirect({
                    authorizationParams: { screen_hint: "signup" },
                  });
                }}
                className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg z-10 hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Sign up to get access
              </button>
            )}
            <Link
              to={isAuthenticated ? "/pdf-converter" : "#"}
              onClick={(e) => !isAuthenticated && e.preventDefault()}
              className={`block bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transition-all duration-300 ${
                isAuthenticated
                  ? "hover:shadow-2xl transform hover:-translate-y-2 flex flex-col w-full"
                  : "opacity-60 grayscale blur-[0.5px] cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-6">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                PDF to DOCX
              </h2>
              <p
                className={`text-gray-600 mb-4 ${
                  isAuthenticated ? "flex-grow" : ""
                }`}
              >
                Convert your PDF files to Microsoft Word (DOCX) format for easy
                editing.
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                Start Converting
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          </div>

          {/* PDF Compressor Card */}
          <div className={`relative ${isAuthenticated ? "flex" : ""}`}>
            {!isAuthenticated && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  loginWithRedirect({
                    authorizationParams: { screen_hint: "signup" },
                  });
                }}
                className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg z-10 hover:bg-green-700 transition-colors cursor-pointer"
              >
                Sign up to get access
              </button>
            )}
            <Link
              to={isAuthenticated ? "/pdf-compressor" : "#"}
              onClick={(e) => !isAuthenticated && e.preventDefault()}
              className={`block bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transition-all duration-300 ${
                isAuthenticated
                  ? "hover:shadow-2xl transform hover:-translate-y-2 flex flex-col w-full"
                  : "opacity-60 grayscale blur-[0.5px] cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-xl mb-6">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                PDF Compressor
              </h2>
              <p
                className={`text-gray-600 mb-4 ${
                  isAuthenticated ? "flex-grow" : ""
                }`}
              >
                Reduce PDF file size with minimal quality loss. Fast and secure
                compression.
              </p>
              <div className="flex items-center text-green-600 font-medium">
                Compress PDF
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Secure & Private
              </h3>
              <p className="text-gray-600 text-sm">
                All processing happens in your browser. Your files never leave
                your device.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Fast & Efficient
              </h3>
              <p className="text-gray-600 text-sm">
                Lightning-fast processing with modern web technologies.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Easy to Use
              </h3>
              <p className="text-gray-600 text-sm">
                Intuitive interface designed for simplicity and efficiency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/pdf-converter"
            element={
              <ProtectedRoute>
                <PdfConverter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pdf-compressor"
            element={
              <ProtectedRoute>
                <PdfCompressor />
              </ProtectedRoute>
            }
          />
          <Route path="/password-generator" element={<PasswordGenerator />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
