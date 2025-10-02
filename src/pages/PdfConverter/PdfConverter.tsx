import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from "pdfjs-dist";
import { Document, Packer, Paragraph, TextRun } from "docx";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

const PdfConverter: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedDocx, setConvertedDocx] = useState<Blob | null>(null);
  const [error, setError] = useState<string>("");
  const [pageCount, setPageCount] = useState<number>(0);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === "application/pdf") {
        setPdfFile(file);
        setError("");
        setConvertedDocx(null);
        setPageCount(0);
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
    setConvertedDocx(null);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const paragraphs: Paragraph[] = [];

      // Add title
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Converted from PDF",
              bold: true,
              size: 32,
            }),
          ],
          spacing: {
            after: 400,
          },
        })
      );

      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Add page header
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Page ${i}`,
                bold: true,
                size: 24,
              }),
            ],
            spacing: {
              before: 200,
              after: 200,
            },
          })
        );

        // Extract text items and group them
        const textItems = textContent.items as any[];
        let currentLine = "";

        textItems.forEach((item, index) => {
          currentLine += item.str;

          // Check if this is the end of a line (next item has different y position or is last item)
          const nextItem = textItems[index + 1];
          if (
            !nextItem ||
            Math.abs(nextItem.transform[5] - item.transform[5]) > 2
          ) {
            if (currentLine.trim()) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: currentLine.trim(),
                    }),
                  ],
                  spacing: {
                    after: 100,
                  },
                })
              );
            }
            currentLine = "";
          } else {
            currentLine += " ";
          }
        });
      }

      // Create the document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      // Generate the DOCX file
      const blob = await Packer.toBlob(doc);
      setConvertedDocx(blob);
      setPageCount(pdf.numPages);

      // Automatically download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFile.name.replace(".pdf", ".docx");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to convert PDF: " + (err as Error).message);
    } finally {
      setIsConverting(false);
    }
  };

  const downloadConverted = () => {
    if (!convertedDocx || !pdfFile) return;

    const url = URL.createObjectURL(convertedDocx);
    const a = document.createElement("a");
    a.href = url;
    a.download = pdfFile.name.replace(".pdf", ".docx");
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
            PDF to DOCX Converter
          </h1>
          <p className="text-gray-600">
            Convert your PDF files to Microsoft Word (DOCX) format
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

          {/* Convert Button */}
          <div className="mt-8">
            <button
              onClick={convertPdf}
              disabled={!pdfFile || isConverting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isConverting ? (
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
                  Converting...
                </span>
              ) : (
                "Convert to DOCX"
              )}
            </button>
          </div>

          {/* Conversion Results */}
          {convertedDocx && (
            <div className="mt-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Conversion Complete!
                </h3>
                <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Document Ready</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {pdfFile?.name.replace(".pdf", ".docx")}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {pageCount} page{pageCount !== 1 ? "s" : ""} converted
                      </p>
                    </div>
                    <svg
                      className="w-12 h-12 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={downloadConverted}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
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
                  Download DOCX File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            About PDF to DOCX Conversion
          </h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2 mt-1">✓</span>
              <span>
                <strong>Text Extraction:</strong> Extracts all text content from
                your PDF and converts it to an editable Word document.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2 mt-1">✓</span>
              <span>
                <strong>Page Preservation:</strong> Maintains page structure
                with clear page markers in the output document.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2 mt-1">✓</span>
              <span>
                <strong>Client-Side Processing:</strong> All conversion happens
                in your browser. Your files never leave your device.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2 mt-1">ℹ</span>
              <span>
                <strong>Note:</strong> Complex formatting, images, and special
                layouts may require manual adjustment after conversion.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PdfConverter;
