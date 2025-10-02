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

      // Extract text from each page with layout preservation
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
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

        // Group text items by lines based on Y position
        const textItems = textContent.items as any[];
        const lines: any[][] = [];
        let currentY = -1;
        let currentLineItems: any[] = [];

        textItems.forEach((item) => {
          const y = item.transform[5];

          // If Y position changed significantly, start new line
          if (currentY === -1 || Math.abs(y - currentY) > 2) {
            if (currentLineItems.length > 0) {
              lines.push([...currentLineItems]);
            }
            currentLineItems = [item];
            currentY = y;
          } else {
            currentLineItems.push(item);
          }
        });

        if (currentLineItems.length > 0) {
          lines.push(currentLineItems);
        }

        // Detect potential tables by analyzing line structure
        let tableLineCount = 0;
        lines.forEach((line) => {
          if (line.length >= 3) tableLineCount++;
        });

        // Convert lines to paragraphs with alignment and spacing detection
        const pageWidth = viewport.width;
        const centerThreshold = 0.2; // 20% tolerance

        lines.forEach((line, lineIndex) => {
          if (line.length === 0) return;

          // Sort items by X position (left to right)
          line.sort((a, b) => a.transform[4] - b.transform[4]);

          // Calculate line position for alignment detection
          const leftMostX = Math.min(...line.map((item) => item.transform[4]));
          const rightMostX = Math.max(
            ...line.map((item) => item.transform[4] + (item.width || 0))
          );
          const centerX = (leftMostX + rightMostX) / 2;
          const pageCenterX = pageWidth / 2;

          // Detect alignment
          let alignment: any = undefined;
          if (Math.abs(centerX - pageCenterX) / pageWidth < centerThreshold) {
            alignment = "center";
          } else if (rightMostX > pageWidth * 0.8) {
            alignment = "right";
          }

          // Build line text with proper spacing
          let lineText = "";
          let lastX = -1;

          line.forEach((item, idx) => {
            const currentX = item.transform[4];

            // Add spacing if there's a gap between items (potential table columns)
            if (lastX !== -1 && currentX - lastX > 20) {
              lineText += "\t"; // Use tab for column-like spacing
            } else if (idx > 0) {
              lineText += " ";
            }

            lineText += item.str;
            lastX = currentX + (item.width || 0);
          });

          if (lineText.trim()) {
            // Detect if line might be a heading (larger font, bold, etc.)
            const avgHeight =
              line.reduce((sum, item) => sum + (item.height || 12), 0) /
              line.length;
            const isBold = line.some(
              (item) => item.fontName && item.fontName.includes("Bold")
            );
            const isLarger = avgHeight > 14;

            // Calculate spacing based on next line distance
            let spacingAfter = 100;
            if (lineIndex < lines.length - 1) {
              const nextLine = lines[lineIndex + 1];
              if (nextLine.length > 0) {
                const currentLineY = line[0].transform[5];
                const nextLineY = nextLine[0].transform[5];
                const gap = Math.abs(currentLineY - nextLineY);
                if (gap > 20) spacingAfter = 200;
                if (gap > 40) spacingAfter = 300;
              }
            }

            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: lineText.trim(),
                    bold: isBold,
                    size: isLarger ? 28 : 22,
                  }),
                ],
                alignment: alignment,
                spacing: {
                  after: spacingAfter,
                  before: isLarger ? 150 : 0,
                },
              })
            );
          }
        });

        // Add note if table-like structure was detected
        if (tableLineCount >= 3) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `[Note: Potential table structure detected with ${tableLineCount} multi-column lines. Tab-separated columns preserved.]`,
                  italics: true,
                  size: 20,
                  color: "666666",
                }),
              ],
              spacing: {
                before: 150,
                after: 150,
              },
            })
          );
        }
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
                <strong>Enhanced Text Extraction:</strong> Extracts text content
                and preserves positioning to maintain layout structure.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2 mt-1">✓</span>
              <span>
                <strong>Alignment Detection:</strong> Automatically detects and
                preserves left, center, and right text alignment.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2 mt-1">✓</span>
              <span>
                <strong>Table Detection:</strong> Identifies potential table
                structures and preserves column spacing using tabs.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2 mt-1">✓</span>
              <span>
                <strong>Formatting Preservation:</strong> Detects bold text,
                font sizes, and heading styles from the original PDF.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2 mt-1">✓</span>
              <span>
                <strong>Spacing Intelligence:</strong> Analyzes line gaps to
                preserve paragraph spacing and document flow.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2 mt-1">✓</span>
              <span>
                <strong>Client-Side Processing:</strong> All conversion happens
                in your browser. Your files never leave your device.
              </span>
            </li>
          </ul>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Important Limitations
            </h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>
                • <strong>Complex Tables:</strong> Multi-row/column spans and
                nested tables are converted to tab-separated text
              </li>
              <li>
                • <strong>Images & Graphics:</strong> Visual elements are not
                extracted (text only)
              </li>
              <li>
                • <strong>Advanced Formatting:</strong> Colors, borders, and
                complex styling may not be preserved
              </li>
              <li>
                • <strong>Manual Review Required:</strong> Please review and
                adjust the output document as needed
              </li>
              <li className="mt-2 pt-2 border-t border-yellow-200">
                💡 <strong>Tip:</strong> For professional-grade conversion with
                perfect layout preservation, consider commercial PDF conversion
                services
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfConverter;
