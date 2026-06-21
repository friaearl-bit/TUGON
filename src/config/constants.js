// /src/config/constants.js

// Define categories
export const ComplaintCategory = {
  WASTE_MANAGEMENT: "WASTE_MANAGEMENT",
  INFRASTRUCTURE_ROADS: "INFRASTRUCTURE_ROADS",
  UTILITIES: "UTILITIES",
  PUBLIC_ORDER_ZONING: "PUBLIC_ORDER_ZONING",
  BUREAUCRATIC_DELAYS: "BUREAUCRATIC_DELAYS",
};

export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_COMPLAINTS = 10;

export const UPLOAD_DEST = "uploads/";
export const MAX_FILES = 10;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "video/mp4",
];
