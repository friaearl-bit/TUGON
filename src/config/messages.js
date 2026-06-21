// config/messages.js

import { UNAUTHORIZED } from "http-status-codes";

// Universal system messages

export const SYSTEM_MESSAGES = {
  // Complaint module
  COMPLAINT: {
    VALIDATION_ERROR: {
      type: "error",
      title: "Validation Error",
      message: "Category, Subject, Description, and Priority are required",
    },
    MAX_COMPLAINTS: {
      type: "error",
      title: "Limit Reached",
      message: "Maximum 5 active complaints allowed",
    },
    SUCCESS: {
      type: "success",
      title: "Success",
      message: "Complaint submitted successfully",
    },
    NOT_FOUND: {
      type: "error",
      title: "Not Found",
      message: "Complaint not found",
    },
    ALREADY_DELETED: {
      type: "error",
      title: "Already Deleted",
      message: "Complaint already deleted",
    },
    ALREADY_RESTORED: {
      type: "error",
      title: "Already Restored",
      message: "Complaint is already not deleted",
    },
    INVALID_ID: {
      type: "error",
      title: "Invalid ID",
      message: "Invalid complaint ID",
    },
  },

  // Auth module
  AUTH: {
    UNAUTHORIZED_ACTION: {
      type: "error",
      title: "Unauthorized",
      message: "You don't have permission to perform this action",
    },
    UNAUTHORIZED_PAGE: {
      type: "error",
      title: "Unauthorized",
      message: "You don't have permission to view this page.",
    },
    INVALID_CREDENTIALS: {
      type: "error",
      title: "Login Failed",
      message: "Invalid email or password",
    },
    SESSION_EXPIRED: {
      type: "error",
      title: "Session Expired",
      message: "Please log in again",
    },
    LOGIN_SUCCESS: {
      type: "success",
      title: "Welcome",
      message: "You are now logged in",
    },
  },

  // User
  USER: {
    NOT_FOUND: {
      type: "error",
      title: "Not found",
      message: "User not found",
    },
    INVALID_ID: {
      type: "error",
      title: "Invalid ID",
      message: "Invalid user ID",
    },
  },

  // Admin module
  ADMIN: {
    ASSIGN_SUCCESS: {
      type: "success",
      title: "Assigned",
      message: "Complaint assigned successfully",
    },
  },

  // Generic
  GENERIC: {
    SERVER_ERROR: {
      type: "error",
      title: "Server Error",
      message: "Something went wrong. Please try again.",
    },
    NOT_FOUND: {
      type: "error",
      title: "Not Found",
      message: "The requested resource was not found",
    },
  },
};
