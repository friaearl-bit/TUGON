import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log("🌱 Super Extended MCRS seeding started...");

  const hash = await bcrypt.hash("password123", 10);

  // =========================
  // DEPARTMENTS
  // =========================
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: "Environment Office" },
      update: {},
      create: { name: "Environment Office", description: "Waste & sanitation" },
    }),
    prisma.department.upsert({
      where: { name: "Engineering Office" },
      update: {},
      create: {
        name: "Engineering Office",
        description: "Roads & infrastructure",
      },
    }),
    prisma.department.upsert({
      where: { name: "Public Utilities Office" },
      update: {},
      create: {
        name: "Public Utilities Office",
        description: "Water & electricity",
      },
    }),
  ]);

  const [envDept, engDept, utilDept] = departments;
  // =========================
  // USERS - FULL FIELDS
  // =========================

  // Helper: Generate realistic name parts
  const firstNames = [
    "John",
    "Jane",
    "Michael",
    "Emily",
    "David",
    "Sarah",
    "Robert",
    "Jennifer",
    "James",
    "Lisa",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
  ];
  const middleNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const streets = [
    "Main St",
    "Oak Ave",
    "Pine Rd",
    "Maple Dr",
    "Cedar Ln",
    "Elm St",
    "Birch Ave",
    "Spruce Rd",
  ];
  const barangays = [
    "Barangay 1",
    "Barangay 2",
    "Barangay 3",
    "Central",
    "North",
    "South",
    "East",
    "West",
  ];

  // Helper: Generate full address
  const generateAddress = () => {
    const street = streets[Math.floor(Math.random() * streets.length)];
    const barangay = barangays[Math.floor(Math.random() * barangays.length)];
    const building = Math.floor(Math.random() * 100) + 1;
    return `${building} ${street}, ${barangay}`;
  };

  // Helper: Generate contact number
  const generateContactNumber = () => {
    return `09${Math.floor(100000000 + Math.random() * 900000000)}`;
  };

  // Helper: Generate username from email
  const generateUsername = (email) => {
    return email.split("@")[0].replace(/\./g, "_");
  };

  // =========================
  // SUPERADMIN
  // =========================
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@mcrs.com" },
    update: {},
    create: {
      name: "Super Admin",
      firstName: "Super",
      middleName: "A",
      lastName: "Admin",
      fullname: "Super A Admin",
      username: "superadmin",
      email: "superadmin@mcrs.com",
      password: hash,
      role: "SUPERADMIN",
      contactNumber: "09123456789",
      address: "City Hall, Central Barangay",
      isActive: true,
    },
  });

  // =========================
  // ADMIN
  // =========================
  const admin = await prisma.user.upsert({
    where: { email: "admin@mcrs.com" },
    update: {},
    create: {
      name: "Admin User",
      firstName: "Admin",
      middleName: "B",
      lastName: "User",
      fullname: "Admin B User",
      username: "admin",
      email: "admin@mcrs.com",
      password: hash,
      role: "ADMIN",
      contactNumber: "09234567890",
      address: "Admin Building, Main St",
      isActive: true,
    },
  });

  // =========================
  // STAFF
  // =========================
  const staff = [];

  const createStaff = async (email, name, deptId) => {
    const firstName = name.split(" ")[0];
    const lastName = name.split(" ").slice(1).join(" ");
    const middleName =
      middleNames[Math.floor(Math.random() * middleNames.length)];

    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        firstName,
        middleName,
        lastName,
        fullname: name,
        username: generateUsername(email),
        email,
        password: hash,
        role: "STAFF",
        departmentId: deptId,
        contactNumber: generateContactNumber(),
        address: generateAddress(),
        isActive: true,
      },
    });
    staff.push(u);
    return u;
  };

  const envStaff = await Promise.all([
    createStaff("env1@mcrs.com", "Env Staff 1", envDept.id),
    createStaff("env2@mcrs.com", "Env Staff 2", envDept.id),
  ]);

  const engStaff = await Promise.all([
    createStaff("eng1@mcrs.com", "Eng Staff 1", engDept.id),
    createStaff("eng2@mcrs.com", "Eng Staff 2", engDept.id),
  ]);

  const utilStaff = await Promise.all([
    createStaff("util1@mcrs.com", "Util Staff 1", utilDept.id),
    createStaff("util2@mcrs.com", "Util Staff 2", utilDept.id),
  ]);

  // =========================
  // CITIZENS (with full fields)
  // =========================
  const citizens = [];

  for (let i = 1; i <= 60; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const middleName =
      middleNames[Math.floor(Math.random() * middleNames.length)];
    const fullname = `${firstName} ${middleName}. ${lastName}`;

    const citizen = await prisma.user.upsert({
      where: { email: `citizen${i}@test.com` },
      update: {},
      create: {
        name: `Citizen ${i}`,
        firstName,
        middleName,
        lastName,
        fullname,
        username: `citizen${i}`,
        email: `citizen${i}@test.com`,
        password: hash,
        role: "CITIZEN",
        contactNumber: generateContactNumber(),
        address: generateAddress(),
        isActive: true,
      },
    });
    citizens.push(citizen);
  }

  // =========================
  // DATA POOLS
  // =========================

  const categories = [
    "WASTE_MANAGEMENT",
    "INFRASTRUCTURE_ROADS",
    "UTILITIES",
    "PUBLIC_ORDER_ZONING",
    "BUREAUCRATIC_DELAYS",
  ];

  const priorities = ["LOW", "NORMAL", "HIGH", "CRITICAL"];

  const statuses = ["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

  const titles = [
    "Missed Garbage Collection",
    "Large Pothole",
    "Water Leakage",
    "Illegal Parking",
    "Delayed Permit Processing",
    "Broken Streetlight",
    "Clogged Drainage",
  ];

  // =========================
  // COMPLAINTS (bulk)
  // =========================

  const complaints = [];

  for (let i = 1; i <= 120; i++) {
    const citizen = rand(citizens);
    const category = rand(categories);
    const priority = rand(priorities);
    const title = rand(titles);
    const status = rand(statuses);

    let assignedTo = null;
    let assignedDept = null;
    let assignedBy = null;
    let assignedAt = null;
    let resolvedAt = null;

    if (status !== "PENDING") {
      assignedBy = admin.id;
      assignedAt = new Date();

      if (category === "WASTE_MANAGEMENT") assignedTo = rand(envStaff).id;
      if (category === "INFRASTRUCTURE_ROADS") assignedTo = rand(engStaff).id;
      if (category === "UTILITIES") assignedTo = rand(utilStaff).id;
    }

    if (status === "RESOLVED" || status === "CLOSED") {
      resolvedAt = new Date();
    }

    const complaint = await prisma.complaint.create({
      data: {
        referenceNo: `MCRS-2026-${String(i).padStart(6, "0")}`,
        title,
        subject: title,
        description: `${title} reported in barangay area.`,
        category,
        priority,
        status,

        barangay: "Sample Barangay",
        streetName: "Main Street",

        createdById: citizen.id,
        complainantId: citizen.id,

        assignedToId: assignedTo,
        assignedById: assignedBy,
        assignedDepartmentId:
          category === "WASTE_MANAGEMENT"
            ? envDept.id
            : category === "INFRASTRUCTURE_ROADS"
              ? engDept.id
              : utilDept.id,

        assignedAt,
        resolvedAt,
      },
    });

    complaints.push(complaint);
  }

  // =========================
  // ACTIVITIES + STATUS LOGS
  // =========================

  for (const c of complaints) {
    await prisma.complaintActivity.create({
      data: {
        complaintId: c.id,
        userId: c.createdById,
        type: "CREATED",
        remarks: "Complaint created",
      },
    });

    if (c.assignedToId) {
      await prisma.complaintActivity.create({
        data: {
          complaintId: c.id,
          userId: c.assignedById || admin.id,
          type: "ASSIGNED",
          remarks: "Assigned to staff",
        },
      });
    }

    await prisma.complaintStatusLog.create({
      data: {
        complaintId: c.id,
        changedById: c.createdById,
        toStatus: c.status,
        remarks: "Initial status set",
      },
    });

    // simulate resolution flow
    if (c.status === "RESOLVED") {
      await prisma.complaintActivity.create({
        data: {
          complaintId: c.id,
          userId: c.assignedToId || admin.id,
          type: "RESOLVED",
          remarks: "Resolved by staff",
        },
      });
    }
  }

  // =========================
  // SAMPLE REJECTIONS
  // =========================

  const rejectedComplaints = complaints.slice(0, 10);

  for (const c of rejectedComplaints) {
    await prisma.complaintRejection.create({
      data: {
        complaintId: c.id,
        requestedById: staff[0].id,
        reason: "Duplicate complaint",
        status: "PENDING",
      },
    });
  }

  // =========================
  // NOTIFICATIONS
  // =========================

  for (const c of complaints.slice(0, 30)) {
    await prisma.notification.create({
      data: {
        userId: c.createdById,
        complaintId: c.id,
        title: "Complaint Update",
        message: `Your complaint ${c.referenceNo} is currently ${c.status}`,
      },
    });
  }

  console.log("✅ Super Extended seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
