import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useAuth0 } from "@auth0/auth0-react";

const PdfCompressor: React.FC = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedPdf, setCompressedPdf] = useState<Blob | null>(null);
  const [error, setError] = useState<string>("");
  const [compressionLevel, setCompressionLevel] = useState<number>(50);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    reduction: number;
  } | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === "application/pdf") {
        setPdfFile(file);
        setError("");
        setCompressedPdf(null);
        setCompressionStats(null);
      } else {
        setError("Please upload a valid PDF file");
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const compressPdf = async () => {
    if (!pdfFile) return;

    setIsCompressing(true);
    setError("");
    setCompressedPdf(null);

    try {
      const originalSize = pdfFile.size;

      // Get Auth0 access token (JWT)
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience:
            process.env.REACT_APP_AUTH0_AUDIENCE || `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/`,
          scope: "openid profile email",
        },
      });

      // Create form data
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("compressionLevel", compressionLevel.toString());

      // Call backend API
      const apiUrl =
        process.env.REACT_APP_BACKEND_API_URL || "http://localhost:8085";
      const response = await fetch(`${apiUrl}/api/pdf/v2/compress`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to compress PDF: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      // Get the compressed PDF blob
      const blob = await response.blob();
      const compressedSize = blob.size;
      const reduction = ((originalSize - compressedSize) / originalSize) * 100;

      setCompressedPdf(blob);
      setCompressionStats({
        originalSize,
        compressedSize,
        reduction: Math.max(0, reduction), // Ensure non-negative
      });
    } catch (err) {
      setError("Failed to compress PDF: " + (err as Error).message);
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadCompressed = () => {
    if (!compressedPdf || !pdfFile) return;

    const url = URL.createObjectURL(compressedPdf);
    const a = document.createElement("a");
    a.href = url;
    a.download = pdfFile.name.replace(".pdf", "_compressed.pdf");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            PDF Compressor
          </h1>
          <p className="text-gray-600">
            Compress your PDF files with minimal quality loss
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Drag and Drop Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-gray-400 bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-4 text-lg text-gray-600">
              {isDragActive
                ? "Drop the PDF file here"
                : "Drag & drop a PDF file here, or click to select"}
            </p>
            {pdfFile && (
              <div className="mt-3">
                <p className="text-sm text-green-600 font-medium">
                  Selected: {pdfFile.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Size: {formatFileSize(pdfFile.size)}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Compression Level Slider */}
          {pdfFile && (
            <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
              <label
                htmlFor="compressionLevel"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Compression Level: {compressionLevel}%
              </label>
              <div className="flex items-center space-x-4">
                <span className="text-xs text-gray-600 font-medium">Low</span>
                <input
                  type="range"
                  id="compressionLevel"
                  min="0"
                  max="100"
                  value={compressionLevel}
                  onChange={(e) => setCompressionLevel(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <span className="text-xs text-gray-600 font-medium">High</span>
              </div>
              <p className="mt-2 text-xs text-gray-600">
                Higher compression levels reduce file size more but may affect
                quality
              </p>
            </div>
          )}

          {/* Compress Button */}
          <div className="mt-8">
            <button
              onClick={compressPdf}
              disabled={!pdfFile || isCompressing}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium text-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isCompressing ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Compressing...
                </span>
              ) : (
                "Compress PDF"
              )}
            </button>
          </div>

          {/* Compression Results */}
          {compressionStats && compressedPdf && (
            <div className="mt-8">
              <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Compression Results
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Original Size</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatFileSize(compressionStats.originalSize)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">
                      Compressed Size
                    </p>
                    <p className="text-xl font-bold text-green-600">
                      {formatFileSize(compressionStats.compressedSize)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Size Reduction</p>
                    <p className="text-xl font-bold text-blue-600">
                      {compressionStats.reduction.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <button
                  onClick={downloadCompressed}
                  className="mt-6 w-full bg-green-600 text-white py-3 px-6 rounded-lg text-sm font-medium hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Compressed PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            How It Works
          </h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">✓</span>
              <span>
                <strong>Server-Side Processing:</strong> Your PDF is securely
                processed on our backend server using advanced compression
                algorithms.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">✓</span>
              <span>
                <strong>Adjustable Compression:</strong> Choose your desired
                compression level (0-100) to balance file size and quality.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">✓</span>
              <span>
                <strong>Secure & Authenticated:</strong> Your files are
                protected with JWT authentication via Auth0.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">✓</span>
              <span>
                <strong>Professional Quality:</strong> Maintains document
                quality while significantly reducing file size.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PdfCompressor;
