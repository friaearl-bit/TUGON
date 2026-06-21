import { ZodError } from "zod";

// export const errorHandler = (err, req, res, next) => {
//   if (err instanceof ZodError) {
//     return res.status(400).json({
//       message: "Validation failed",
//       errors: err.flatten(),
//     });
//   }

//   console.error(err);

//   return res.status(500).json({
//     message: "Internal Server Error",
//   });
// };

export const errorHandler = (err, req, res, next) => {
  console.error("ERROR:");
  console.error(err);
  console.error(ZodError);

  return res.status(500).json({
    message: err.message,
    stack: err.stack,
  });
};
