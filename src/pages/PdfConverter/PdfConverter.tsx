import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

type ConversionFormat = "text" | "html" | "json" | "images";

const PdfConverter: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [selectedFormat, setSelectedFormat] =
    useState<ConversionFormat>("text");
  const [isConverting, setIsConverting] = useState(false);
  const [convertedContent, setConvertedContent] = useState<string>("");
  const [error, setError] = useState<string>("");

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === "application/pdf") {
        setPdfFile(file);
        setError("");
        setConvertedContent("");
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

  const convertPdf = async () => {
    if (!pdfFile) return;

    setIsConverting(true);
    setError("");
    setConvertedContent("");

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let result = "";

      if (selectedFormat === "text") {
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          result += `--- Page ${i} ---\n${pageText}\n\n`;
        }
      } else if (selectedFormat === "html") {
        result = "<html>\n<body>\n";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          result += `<div class="page">\n<h2>Page ${i}</h2>\n<p>${pageText}</p>\n</div>\n`;
        }
        result += "</body>\n</html>";
      } else if (selectedFormat === "json") {
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          pages.push({ page: i, text: pageText });
        }
        result = JSON.stringify({ pages }, null, 2);
      } else if (selectedFormat === "images") {
        result =
          "Image extraction would require canvas rendering. This is a simplified implementation showing text extraction only.";
      }

      setConvertedContent(result);
    } catch (err) {
      setError("Failed to convert PDF: " + (err as Error).message);
    } finally {
      setIsConverting(false);
    }
  };

  const downloadConverted = () => {
    if (!convertedContent) return;

    const extensions: Record<ConversionFormat, string> = {
      text: "txt",
      html: "html",
      json: "json",
      images: "txt",
    };

    const blob = new Blob([convertedContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${extensions[selectedFormat]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            PDF Converter
          </h1>
          <p className="text-gray-600">
            Convert your PDF files to various formats
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Drag and Drop Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
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
              <p className="mt-2 text-sm text-green-600 font-medium">
                Selected: {pdfFile.name}
              </p>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Format Selection */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Output Format
            </label>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(["text", "html", "json", "images"] as ConversionFormat[]).map(
                (format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200 ${
                      selectedFormat === format
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Convert Button */}
          <div className="mt-8">
            <button
              onClick={convertPdf}
              disabled={!pdfFile || isConverting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isConverting ? "Converting..." : "Convert PDF"}
            </button>
          </div>

          {/* Converted Content Display */}
          {convertedContent && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Converted Content
                </label>
                <button
                  onClick={downloadConverted}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all duration-200"
                >
                  Download
                </button>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {convertedContent}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Supported Formats Info */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Supported Conversion Formats
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                <strong>TEXT:</strong> Extract plain text content from PDF
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                <strong>HTML:</strong> Convert PDF content to HTML format
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                <strong>JSON:</strong> Structure PDF content as JSON data
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>
                <strong>IMAGES:</strong> Extract images from PDF (simplified)
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PdfConverter;
