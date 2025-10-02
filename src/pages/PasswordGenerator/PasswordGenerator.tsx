import React, { useState, useEffect, useRef } from "react";

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  easyToSay: boolean;
  easyToRead: boolean;
}

const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState("");
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    easyToSay: false,
    easyToRead: false,
  });
  const [copied, setCopied] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const generatePassword = () => {
    let charset = "";
    let newPassword = "";

    // Build character set based on options
    if (options.lowercase) {
      charset += options.easyToRead
        ? "abcdefghjkmnpqrstuvwxyz"
        : "abcdefghijklmnopqrstuvwxyz";
    }
    if (options.uppercase) {
      charset += options.easyToRead
        ? "ABCDEFGHJKLMNPQRSTUVWXYZ"
        : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    }
    if (options.numbers) {
      charset += options.easyToRead ? "23456789" : "0123456789";
    }
    if (options.symbols) {
      charset += options.easyToRead ? "!@#$%^&*" : "!@#$%^&*()_+-=[]{}|;:,.<>?";
    }

    // Filter out characters that are hard to say if that option is selected
    if (options.easyToSay) {
      charset = charset.replace(/[0OoIl1]/g, "");
    }

    if (charset.length === 0) {
      setPassword("Please select at least one character type");
      return;
    }

    // Generate password
    for (let i = 0; i < options.length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      newPassword += charset[randomIndex];
    }

    setPassword(newPassword);
    setCopied(false);
  };

  useEffect(() => {
    generatePassword();
  }, []); // Generate initial password on mount

  // Auto-regenerate password with debounce when options change
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      generatePassword();
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [options]); // Re-run when options change

  const handleOptionChange = (
    key: keyof PasswordOptions,
    value: boolean | number
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Password Generator
          </h1>
          <p className="text-gray-600">Create secure passwords instantly</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Password Display */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Your New Password
            </label>
            <div className="flex gap-2 items-center">
              <div className="relative bg-gray-50 border-2 border-gray-200 rounded-lg flex-1 min-w-0">
                <div className="overflow-x-auto overflow-y-hidden p-4 pr-20">
                  <div className="text-xl font-mono text-gray-800 whitespace-nowrap">
                    {password || "Click generate to create password"}
                  </div>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-all duration-200 flex items-center p-2"
                  title={copied ? "Copied!" : "Copy password"}
                >
                  {copied ? (
                    <svg
                      className="w-7 h-7"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-7 h-7"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <button
                onClick={generatePassword}
                className="text-gray-600 hover:text-gray-800 transition-all duration-200 flex items-center p-2 flex-shrink-0"
                title="Regenerate password"
              >
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Password Length Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-gray-700">
                Password Length
              </label>
              <span className="text-lg font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                {options.length}
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="50"
              value={options.length}
              onChange={(e) =>
                handleOptionChange("length", parseInt(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              style={{
                background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${
                  ((options.length - 8) / 42) * 100
                }%, #e5e7eb ${
                  ((options.length - 8) / 42) * 100
                }%, #e5e7eb 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>8</span>
              <span>50</span>
            </div>
          </div>

          {/* Character Options */}
          <div className="mb-8 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Character Options
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <span className="text-gray-700 font-medium">
                  Uppercase Letters (A-Z)
                </span>
                <input
                  type="checkbox"
                  checked={options.uppercase}
                  onChange={(e) =>
                    handleOptionChange("uppercase", e.target.checked)
                  }
                  className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <span className="text-gray-700 font-medium">
                  Lowercase Letters (a-z)
                </span>
                <input
                  type="checkbox"
                  checked={options.lowercase}
                  onChange={(e) =>
                    handleOptionChange("lowercase", e.target.checked)
                  }
                  className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <span className="text-gray-700 font-medium">Numbers (0-9)</span>
                <input
                  type="checkbox"
                  checked={options.numbers}
                  onChange={(e) =>
                    handleOptionChange("numbers", e.target.checked)
                  }
                  className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <span className="text-gray-700 font-medium">
                  Symbols (!@#$%^&*)
                </span>
                <input
                  type="checkbox"
                  checked={options.symbols}
                  onChange={(e) =>
                    handleOptionChange("symbols", e.target.checked)
                  }
                  className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="mb-8 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Advanced Options
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <span className="text-gray-700 font-medium">
                  Easy to Say (no ambiguous characters)
                </span>
                <input
                  type="checkbox"
                  checked={options.easyToSay}
                  onChange={(e) =>
                    handleOptionChange("easyToSay", e.target.checked)
                  }
                  className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <span className="text-gray-700 font-medium">
                  Easy to Read (avoid similar characters)
                </span>
                <input
                  type="checkbox"
                  checked={options.easyToRead}
                  onChange={(e) =>
                    handleOptionChange("easyToRead", e.target.checked)
                  }
                  className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Security Tips */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Password Security Tips
          </h2>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Use a minimum of 12 characters for better security</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>
                Include a mix of uppercase, lowercase, numbers, and symbols
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Never reuse passwords across different accounts</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Change your passwords regularly</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;
