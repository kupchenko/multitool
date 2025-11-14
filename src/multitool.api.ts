/**
 * MultiTool API Client
 * Centralized API calls for all backend services
 */

import { createAuthHeaders } from "./utils/auth.utils";

/**
 * API Configuration
 */
const API_BASE_URL =
  process.env.REACT_APP_BACKEND_API_URL || "http://localhost:8085";

/**
 * API Endpoints
 */
const ENDPOINTS = {
  PDF_COMPRESS: "/api/pdf/v2/compress",
} as const;

/**
 * API Response types
 */
export interface ApiError {
  message: string;
  status: number;
  statusText: string;
}

/**
 * PDF Compression Request Parameters
 */
export interface PdfCompressRequest {
  file: File;
  compressionLevel: number;
  token: string;
}

/**
 * PDF Compression Response
 */
export interface PdfCompressResponse {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
}

/**
 * Compress a PDF file
 * @param params - PDF compression parameters
 * @returns Compressed PDF blob with statistics
 * @throws ApiError if the request fails
 */
export const compressPdf = async (
  params: PdfCompressRequest
): Promise<PdfCompressResponse> => {
  const { file, compressionLevel, token } = params;

  // Create form data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("compressionLevel", compressionLevel.toString());

  // Make API request
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PDF_COMPRESS}`, {
    method: "POST",
    headers: createAuthHeaders(token),
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error: ApiError = {
      message: `Failed to compress PDF: ${response.status} ${response.statusText}. ${errorText}`,
      status: response.status,
      statusText: response.statusText,
    };
    throw error;
  }

  // Get the compressed PDF blob
  const blob = await response.blob();
  const originalSize = file.size;
  const compressedSize = blob.size;

  return {
    blob,
    originalSize,
    compressedSize,
  };
};

/**
 * API Client with all available methods
 */
export const MultiToolApi = {
  pdf: {
    compress: compressPdf,
  },
} as const;

export default MultiToolApi;

