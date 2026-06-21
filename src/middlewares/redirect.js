// redirect.js
import { StatusCodes } from "http-status-codes";

//
// Global redirect middleware for Express (ESM).
// Handles: auth checks, 404s, role-based access, and custom rules.
//
export function redirectMiddleware(options = {}) {
  const {
    loginUrl = "/login",
    homeUrl = "/dashboard",
    forbiddenUrl = "/403",
    notFoundUrl = "/404",
    // Custom redirect rules: { from: string, to: string, status?: number }
    redirects = [],
    // Role-based access control (if needed)
    isAuthenticated = (req) => !!req.user,
    isAuthorized = (req, requiredRoles = []) => {
      if (!req.user?.roles) return false;
      return requiredRoles.every((role) => req.user.roles.includes(role));
    },
  } = options;

  return (req, res, next) => {
    // 1. Custom static redirects (e.g., old URLs)
    const customRedirect = redirects.find(
      (rule) => rule.from === req.path || rule.from === req.url,
    );
    if (customRedirect) {
      return res.redirect(
        customRedirect.status || StatusCodes.MOVED_PERMANENTLY,
        customRedirect.to,
      );
    }

    // 2. Protected routes (require auth)
    if (req.path.startsWith("/protected") || req.path.startsWith("/admin")) {
      if (!isAuthenticated(req)) {
        return res.redirect(
          StatusCodes.UNAUTHORIZED,
          `${loginUrl}?next=${encodeURIComponent(req.url)}`,
        );
      }
      // Optional: Role-based access
      if (req.path.startsWith("/admin") && !isAuthorized(req, ["admin"])) {
        return res.redirect(StatusCodes.FORBIDDEN, forbiddenUrl);
      }
    }

    // 3. 404 handling (if no route matched later)
    // Note: This is a pre-route check. For post-route 404s, use an error handler.
    next();
  };
}

// Helper: 404 and error handlers (use AFTER routes)
export function notFoundHandler(req, res) {
  res.status(StatusCodes.NOT_FOUND).redirect(notFoundUrl);
}

export function errorHandler(err, req, res, next) {
  if (err.code === "UNAUTHORIZED") {
    res.status(StatusCodes.UNAUTHORIZED).redirect("/login");
  } else if (err.code === "FORBIDDEN") {
    res.status(StatusCodes.FORBIDDEN).redirect("/403");
  } else {
    next(err); // Fallback to default error handler
  }
}

// // // redirect.js (ESM) — conservative redirects, safe for dev
// // const onlyRedirectIfGET = true;
// // function isSafeToRedirect(req) {
// //   return !onlyRedirectIfGET || req.method === "GET";
// // }

// // export function redirectMiddleware({
// //   canonicalHost = null,
// //   forceHttps = false,
// // } = {}) {
// //   return (req, res, next) => {
// //     // 1) Force HTTPS only if explicitly enabled (production)
// //     if (forceHttps) {
// //       const proto = req.get("x-forwarded-proto") || req.protocol;
// //       if (proto !== "https" && isSafeToRedirect(req)) {
// //         return res.redirect(
// //           301,
// //           "https://" + req.get("host") + req.originalUrl,
// //         );
// //       }
// //     }

// //     // 3) Trailing slash for directory-like paths (conservative)
// //     if (isSafeToRedirect(req)) {
// //       const path = req.path || "";
// //       const last = path.split("/").pop();
// //       const hasDot = last && last.includes(".");
// //       if (!hasDot && !path.endsWith("/") && path.split("/").length > 1) {
// //         return res.redirect(
// //           301,
// //           path + "/" + (req.url.slice(path.length) || ""),
// //         );
// //       }
// //     }

// //     next();
// //   };
// // }
