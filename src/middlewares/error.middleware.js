// import { Prisma } from "@prisma/client";

// export const errorHandler = (err, req, res, next) => {
//   console.error(err);

//   // Zod validation
//   if (err.name === "ZodError") {
//     return res.status(400).json({
//       message: "Validation Error",
//       errors: err.errors,
//     });
//   }

//   // Prisma known errors
//   if (err instanceof Prisma.PrismaClientKnownRequestError) {
//     if (err.code === "P2002") {
//       return res.status(409).json({
//         message: "Duplicate field value",
//       });
//     }

//     if (err.code === "P2025") {
//       return res.status(404).json({
//         message: "Record not found",
//       });
//     }
//   }

//   const message = err.expose ? err.message : "Internal Server Error";
//   return res.status(500).json({
//     message: message,
//     // message: "Internal Server Error",
//   });
// };

// // export default (err, req, res, next) => {
// //   console.error(err);

// //   return res.status(500).json({
// //     message: err.message,
// //   });
// // };
