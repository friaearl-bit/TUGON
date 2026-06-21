// src/controllers/user.controller.js

import { prisma } from "../config/prisma.js";
import { logger } from "../utils/logger.js";
import { SYSTEM_MESSAGES } from "../config/messages.js";
import { addToast, addFlash } from "../utils/toast.js";

export async function updateProfile(req, res) {
  console.log("PARAMS:", req.params);
  console.log("BODY:", req.body);
  console.log("USER:", req.user);

  try {
    const userId = Number(req.params.id);

    if (!userId) {
      return res.status(400).render("error", {
        toast: SYSTEM_MESSAGES.USER.INVALID_ID,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).render("error", {
        toast: SYSTEM_MESSAGES.USER.NOT_FOUND,
      });
    }

    const currentUser = req.user;

    // Ownership check
    if (user.id !== currentUser.id && currentUser.role !== "ADMIN") {
      return res.status(403).render("error", {
        toast: SYSTEM_MESSAGES.AUTH.UNAUTHORIZED_ACTION,
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: req.body,
    });

    addToast(req, res, {
      type: "success",
      title: "Success",
      message: "Profile updated successfully.",
    });

    return res.json({
      success: true,
      message: "Profile updated successfully",
    });
    // } catch (err) {
    //   console.error(err);

    //   return res.status(500).json({
    //     success: false,
    //     message: "Update failed",
    //   });
    // }
  } catch (error) {
    console.error("updateProfile:", error);

    addToast(req, res, {
      type: "error",
      title: "Error",
      message: "Failed to update profile. Please try again.",
    });

    return res.status(500).render("error", {
      message: "Failed to update profile",
    });
  }
}

export async function showProfileEditForm(req, res) {
  logger.debug({ userId: req.user?.id }, "Showing complaint form");
  res.render("complaints/new", { user: req.user });
}

/**
 * List all users with filtering
 * Access: ADMIN (view only), SUPERADMIN (view + manage)
 */
// export const listUsers = async (req, res) => {
export const listUsers = async (req, res) => {
  try {
    const { search, role, department } = req.query;
    const currentUser = req.user;

    // Build where clause
    const where = { deletedAt: null };

    // Search filter (name, email, first/last name)
    if (search) {
      where.OR = [
        { fullname: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Department filter
    if (department) {
      where.departmentId = Number(department);
    }

    // Get users with department info
    const users = await prisma.user.findMany({
      where,
      include: { department: true },
      orderBy: { createdAt: "desc" },
    });

    // Get departments for filter dropdown
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    // res.render("user/list", {
    res.render("admin/users", {
      user: req.user,
      title: "User Management",
      users,
      departments,
      currentUser: req.user,
      query: req.query,
    });
  } catch (error) {
    console.error("List users error:", error);
    res.status(500).render("error", {
      message: "Failed to load users",
    });
  }
};

/**
 * Get single user for profile modal
 * Access: All authenticated users (view only)
 */
export const getUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const currentUser = req.user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get departments for edit dropdown
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      user,
      departments,
      canEdit: currentUser.role === "SUPERADMIN",
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

/**
 * Update user (SUPERADMIN only)
 */
export const updateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const currentUser = req.user;

    if (currentUser.role !== "SUPERADMIN") {
      return res
        .status(403)
        .json({ error: "Only Superadmin can update users" });
    }

    if (userId === currentUser.id) {
      return res.status(400).json({ error: "Cannot modify own account" });
    }

    const {
      firstName,
      lastName,
      fullname,
      email,
      contactNumber,
      address,
      username,
      role,
      departmentId,
      isActive,
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        fullname,
        email,
        contactNumber,
        address,
        username,
        role,
        departmentId: departmentId ? Number(departmentId) : null,
        isActive: Boolean(isActive),
      },
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// export { updateUser };

// export const updateUser = async (req, res) => {
//   try {
//     const userId = Number(req.params.id);
//     const currentUser = req.user;

//     // SUPERADMIN only
//     if (currentUser.role !== "SUPERADMIN") {
//       return res.status(403).json({
//         error: "Only Superadmin can update users",
//       });
//     }

//     // Prevent self-modification of role/status
//     if (userId === currentUser.id) {
//       return res.status(400).json({
//         error: "Cannot modify your own account. Contact another Superadmin.",
//       });
//     }

//     const {
//       firstName,
//       lastName,
//       fullname,
//       email,
//       contactNumber,
//       address,
//       username,
//       role,
//       departmentId,
//       isActive,
//     } = req.body;

//     const user = await prisma.user.findUnique({ where: { id: userId } });
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Update user
//     const updatedUser = await prisma.user.update({
//       where: { id: userId },
//       data: {
//         firstName,
//         lastName,
//         fullname,
//         email,
//         contactNumber,
//         address,
//         username,
//         role,
//         departmentId: departmentId ? Number(departmentId) : null,
//         isActive: isActive === true || isActive === "true",
//       },
//     });

//     res.json({
//       success: true,
//       user: updatedUser,
//       message: "User updated successfully",
//     });
//   } catch (error) {
//     console.error("Update user error:", error);
//     res.status(500).json({ error: "Failed to update user: " + error.message });
//   }
// };

/**
 * Create new user (SUPERADMIN only)
 */
// export const createUser = async (req, res) => {
//   try {
//     // In users.controller.js
//     export const updateUser = async (req, res) => {
//       try {
//         const userId = Number(req.params.id);
//         const currentUser = req.user;

//         // 1. Check permissions (SUPERADMIN only)
//         if (currentUser.role !== "SUPERADMIN") {
//           return res.status(403).json({ error: "Unauthorized" });
//         }

//         // 2. Prevent self-modification
//         if (userId === currentUser.id) {
//           return res.status(400).json({ error: "Cannot modify own account" });
//         }

//         // 3. Extract data from request
//         const {
//           firstName,
//           lastName,
//           fullname,
//           email,
//           contactNumber,
//           address,
//           username,
//           role,
//           departmentId,
//           isActive,
//         } = req.body;

//         // 4. Update database via Prisma
//         const updatedUser = await prisma.user.update({
//           where: { id: userId },
//           data: {
//             firstName,
//             lastName,
//             fullname,
//             email,
//             contactNumber,
//             address,
//             username,
//             role,
//             departmentId: departmentId ? Number(departmentId) : null,
//             isActive: Boolean(isActive),
//           },
//         });

//         // 5. Return success
//         res.json({
//           success: true,
//           user: updatedUser,
//           message: "User updated successfully",
//         });
//       } catch (error) {
//         res.status(500).json({ error: error.message });
//       }
//     };
//     const currentUser = req.user;

//     if (currentUser.role !== "SUPERADMIN") {
//       return res
//         .status(403)
//         .json({ error: "Only Superadmin can create users" });
//     }

//     const {
//       firstName,
//       lastName,
//       fullname,
//       email,
//       contactNumber,
//       address,
//       username,
//       password,
//       role,
//       departmentId,
//     } = req.body;

//     // Check if email exists
//     const existingUser = await prisma.user.findUnique({
//       where: { email: email.toLowerCase() },
//     });
//     if (existingUser) {
//       return res.status(400).json({ error: "Email already exists" });
//     }

//     // Hash password
//     const bcrypt = await import("bcrypt");
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = await prisma.user.create({
//       data: {
//         firstName,
//         lastName,
//         fullname,
//         email: email.toLowerCase(),
//         contactNumber,
//         address,
//         username,
//         password: hashedPassword,
//         role,
//         departmentId: departmentId ? Number(departmentId) : null,
//         isActive: true,
//       },
//     });

//     res.json({
//       success: true,
//       user: newUser,
//       message: "User created successfully",
//     });
//   } catch (error) {
//     console.error("Create user error:", error);
//     res.status(500).json({ error: "Failed to create user: " + error.message });
//   }
// };
