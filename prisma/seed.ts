import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import {
  CampusCode,
  Role,
  ApprovalStatus,
  RecordSource,
  PublicationType,
  PublicationIndexing,
  PatentStatus,
  ProjectStatus,
  PhDStatus,
  FDPRole,
  AwardLevel,
  ScoreTier,
  APARStatus,
  NotificationChannel,
  NotificationStatus,
  LeaveType,
} from "../generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding PRAJNA database...");

  // ------------------------------------------------------------------
  // CLEANUP — delete in reverse-dependency order for idempotent re-runs
  // ------------------------------------------------------------------
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.appreciationBadge.deleteMany();
  await prisma.aIMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.dailyReflection.deleteMany();
  await prisma.prajnaScore.deleteMany();
  await prisma.approvalRecord.deleteMany();
  await prisma.leaveRecord.deleteMany();
  await prisma.aPAR.deleteMany();
  await prisma.committeeRole.deleteMany();
  await prisma.examDuty.deleteMany();
  await prisma.internationalVisit.deleteMany();
  await prisma.mOOCCompletion.deleteMany();
  await prisma.facultyDevelopment.deleteMany();
  await prisma.editorialRole.deleteMany();
  await prisma.professionalMembership.deleteMany();
  await prisma.invitedTalk.deleteMany();
  await prisma.award.deleteMany();
  await prisma.moU.deleteMany();
  await prisma.consultancy.deleteMany();
  await prisma.phDScholar.deleteMany();
  await prisma.patent.deleteMany();
  await prisma.researchGrant.deleteMany();
  await prisma.publication.deleteMany();
  await prisma.coPoMapping.deleteMany();
  await prisma.remedialSession.deleteMany();
  await prisma.teachingAssignment.deleteMany();
  await prisma.facultyProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.school.deleteMany();
  await prisma.campus.deleteMany();
  console.log("  ✓ Cleaned existing data");

  // ------------------------------------------------------------------
  // CAMPUSES
  // ------------------------------------------------------------------
  const [bengaluru, vizag, hyderabad] = await Promise.all([
    prisma.campus.upsert({
      where: { code: CampusCode.BENGALURU },
      update: {},
      create: {
        code: CampusCode.BENGALURU,
        name: "GITAM (Deemed to be University), Bengaluru",
      },
    }),
    prisma.campus.upsert({
      where: { code: CampusCode.VISAKHAPATNAM },
      update: {},
      create: {
        code: CampusCode.VISAKHAPATNAM,
        name: "GITAM (Deemed to be University), Visakhapatnam",
      },
    }),
    prisma.campus.upsert({
      where: { code: CampusCode.HYDERABAD },
      update: {},
      create: {
        code: CampusCode.HYDERABAD,
        name: "GITAM (Deemed to be University), Hyderabad",
      },
    }),
  ]);
  console.log("  ✓ Campuses");

  // ------------------------------------------------------------------
  // SCHOOLS (one per campus for seed)
  // ------------------------------------------------------------------
  const schoolBLR = await prisma.school.upsert({
    where: {
      name_campusId: { name: "School of Technology", campusId: bengaluru.id },
    },
    update: {},
    create: { name: "School of Technology", campusId: bengaluru.id },
  });
  const schoolVZG = await prisma.school.upsert({
    where: {
      name_campusId: { name: "School of Technology", campusId: vizag.id },
    },
    update: {},
    create: { name: "School of Technology", campusId: vizag.id },
  });
  const schoolHYD = await prisma.school.upsert({
    where: {
      name_campusId: { name: "School of Technology", campusId: hyderabad.id },
    },
    update: {},
    create: { name: "School of Technology", campusId: hyderabad.id },
  });
  console.log("  ✓ Schools");

  // ------------------------------------------------------------------
  // DEPARTMENTS
  // ------------------------------------------------------------------
  const deptCSE_BLR = await prisma.department.upsert({
    where: { code_schoolId: { code: "CSE-BLR", schoolId: schoolBLR.id } },
    update: {},
    create: {
      name: "Computer Science & Engineering",
      code: "CSE-BLR",
      schoolId: schoolBLR.id,
    },
  });
  const deptECE_BLR = await prisma.department.upsert({
    where: { code_schoolId: { code: "ECE-BLR", schoolId: schoolBLR.id } },
    update: {},
    create: {
      name: "Electronics & Communication Engineering",
      code: "ECE-BLR",
      schoolId: schoolBLR.id,
    },
  });
  const deptCSE_VZG = await prisma.department.upsert({
    where: { code_schoolId: { code: "CSE-VZG", schoolId: schoolVZG.id } },
    update: {},
    create: {
      name: "Computer Science & Engineering",
      code: "CSE-VZG",
      schoolId: schoolVZG.id,
    },
  });
  const deptME_HYD = await prisma.department.upsert({
    where: { code_schoolId: { code: "ME-HYD", schoolId: schoolHYD.id } },
    update: {},
    create: {
      name: "Mechanical Engineering",
      code: "ME-HYD",
      schoolId: schoolHYD.id,
    },
  });
  console.log("  ✓ Departments");

  // ------------------------------------------------------------------
  // USERS — Director, Deans, HoDs, Faculty
  // (passwordHash is a placeholder — bcrypt not installed in seed)
  // ------------------------------------------------------------------
  const PLACEHOLDER_HASH =
    "$2b$10$placeholderHashForSeedDataOnly000000000000000000000";

  // Director (campus-agnostic — we assign to Vizag as home campus)
  const director = await prisma.user.upsert({
    where: { employeeId: 10001 },
    update: {},
    create: {
      email: "director@gitam.edu",
      employeeId: 10001,
      passwordHash: PLACEHOLDER_HASH,
      role: Role.DIRECTOR,
      campusId: vizag.id,
    },
  });

  // Deans
  const deanBLR = await prisma.user.upsert({
    where: { employeeId: 10002 },
    update: {},
    create: {
      email: "dean.tech.blr@gitam.edu",
      employeeId: 10002,
      passwordHash: PLACEHOLDER_HASH,
      role: Role.DEAN,
      campusId: bengaluru.id,
    },
  });
  const deanVZG = await prisma.user.upsert({
    where: { employeeId: 10003 },
    update: {},
    create: {
      email: "dean.tech.vzg@gitam.edu",
      employeeId: 10003,
      passwordHash: PLACEHOLDER_HASH,
      role: Role.DEAN,
      campusId: vizag.id,
    },
  });

  console.log("DO NOT PUSH TO GITHUB");

  // IQAC Coordinator
  const iqac = await prisma.user.upsert({
    where: { employeeId: 10004 },
    update: {},
    create: {
      email: "iqac@gitam.edu",
      employeeId: 10004,
      passwordHash: PLACEHOLDER_HASH,
      role: Role.IQAC_COORDINATOR,
      campusId: vizag.id,
    },
  });

  // System Admin
  const sysAdmin = await prisma.user.upsert({
    where: { employeeId: 10005 },
    update: {},
    create: {
      email: "cats@gitam.edu",
      employeeId: 10005,
      passwordHash: PLACEHOLDER_HASH,
      role: Role.SYSTEM_ADMIN,
      campusId: vizag.id,
    },
  });

  // HoDs
  const hodCSE_BLR = await prisma.user.upsert({
    where: { employeeId: 20001 },
    update: {},
    create: {
      email: "hod.cse.blr@gitam.edu",
      employeeId: 20001,
      passwordHash: PLACEHOLDER_HASH,
      role: Role.HOD,
      campusId: bengaluru.id,
      departmentId: deptCSE_BLR.id,
    },
  });
  const hodECE_BLR = await prisma.user.upsert({
    where: { employeeId: 20002 },
    update: {},
    create: {
      email: "hod.ece.blr@gitam.edu",
      employeeId: 20002,
      passwordHash: PLACEHOLDER_HASH,
      role: Role.HOD,
      campusId: bengaluru.id,
      departmentId: deptECE_BLR.id,
    },
  });
  const hodCSE_VZG = await prisma.user.upsert({
    where: { employeeId: 20003 },
    update: {},
    create: {
      email: "hod.cse.vzg@gitam.edu",
      employeeId: 20003,
      passwordHash: PLACEHOLDER_HASH,
      role: Role.HOD,
      campusId: vizag.id,
      departmentId: deptCSE_VZG.id,
    },
  });

  // Wire deans and HoDs back to schools/departments
  await prisma.school.update({
    where: { id: schoolBLR.id },
    data: { deanId: deanBLR.id },
  });
  await prisma.school.update({
    where: { id: schoolVZG.id },
    data: { deanId: deanVZG.id },
  });
  await prisma.department.update({
    where: { id: deptCSE_BLR.id },
    data: { hodId: hodCSE_BLR.id },
  });
  await prisma.department.update({
    where: { id: deptECE_BLR.id },
    data: { hodId: hodECE_BLR.id },
  });
  await prisma.department.update({
    where: { id: deptCSE_VZG.id },
    data: { hodId: hodCSE_VZG.id },
  });

  // Faculty members
  const faculty1 = await prisma.user.upsert({
    where: { employeeId: 30001 },
    update: {},
    create: {
      email: "priya.sharma@gitam.edu",
      employeeId: 30001,
      passwordHash: PLACEHOLDER_HASH,
      role: Role.FACULTY,
      campusId: bengaluru.id,
      departmentId: deptCSE_BLR.id,
    },
  });
  const faculty2 = await prisma.user.upsert({
    where: { employeeId: 30002 },
    update: {},
    create: {
      email: "rajan.mehta@gitam.edu",
      employeeId: 30002,
      passwordHash: PLACEHOLDER_HASH,
      role: Role.FACULTY,
      campusId: bengaluru.id,
      departmentId: deptCSE_BLR.id,
    },
  });
  const faculty3 = await prisma.user.upsert({
    where: { employeeId: 30003 },
    update: {},
    create: {
      email: "ananya.reddy@gitam.edu",
      employeeId: 30003,
      passwordHash: PLACEHOLDER_HASH,
      role: Role.FACULTY,
      campusId: bengaluru.id,
      departmentId: deptECE_BLR.id,
    },
  });
  const faculty4 = await prisma.user.upsert({
    where: { employeeId: 30004 },
    update: {},
    create: {
      email: "suresh.nair@gitam.edu",
      employeeId: 30004,
      passwordHash: PLACEHOLDER_HASH,
      role: Role.FACULTY,
      campusId: vizag.id,
      departmentId: deptCSE_VZG.id,
    },
  });
  console.log("  ✓ Users (Director, Deans, IQAC, HoDs, Faculty)");

  // ------------------------------------------------------------------
  // FACULTY PROFILES
  // ------------------------------------------------------------------
  const profile1 = await prisma.facultyProfile.upsert({
    where: { userId: faculty1.id },
    update: {},
    create: {
      userId: faculty1.id,
      firstName: "Priya",
      lastName: "Sharma",
      dateOfBirth: new Date("1985-04-12"),
      phone: "+91-9845001001",
      designation: "Associate Professor",
      joiningDate: new Date("2015-07-01"),
      ugDegree: "B.E. Computer Science",
      ugInstitution: "BMS College of Engineering, Bengaluru",
      ugYear: 2007,
      pgDegree: "M.Tech Computer Science",
      pgInstitution: "IIT Madras",
      pgYear: 2009,
      phdTitle: "Deep Learning Approaches for Medical Image Segmentation",
      phdInstitution: "GITAM University",
      phdYear: 2018,
      orcidId: "0000-0002-1234-5678",
      scopusAuthorId: "57200000001",
      googleScholarId: "AbCdEfGhIjK",
      vidwanId: "VID-2023-001234",
      linkedInUrl: "https://linkedin.com/in/priya-sharma-gitam",
      completenessScore: 92.0,
    },
  });

  const profile2 = await prisma.facultyProfile.upsert({
    where: { userId: faculty2.id },
    update: {},
    create: {
      userId: faculty2.id,
      firstName: "Rajan",
      lastName: "Mehta",
      dateOfBirth: new Date("1980-11-25"),
      phone: "+91-9845002002",
      designation: "Professor",
      joiningDate: new Date("2010-01-15"),
      ugDegree: "B.Tech Electronics & Communication",
      ugInstitution: "NIT Trichy",
      ugYear: 2002,
      pgDegree: "M.Tech VLSI Design",
      pgInstitution: "IISc Bengaluru",
      pgYear: 2004,
      phdTitle: "Energy-Efficient Architectures for IoT Edge Computing",
      phdInstitution: "IISc Bengaluru",
      phdYear: 2010,
      orcidId: "0000-0003-9876-5432",
      scopusAuthorId: "57200000002",
      googleScholarId: "ZyXwVuTsRqP",
      vidwanId: "VID-2023-005678",
      completenessScore: 85.0,
    },
  });

  const profile3 = await prisma.facultyProfile.upsert({
    where: { userId: faculty3.id },
    update: {},
    create: {
      userId: faculty3.id,
      firstName: "Ananya",
      lastName: "Reddy",
      dateOfBirth: new Date("1990-08-03"),
      phone: "+91-9845003003",
      designation: "Assistant Professor",
      joiningDate: new Date("2020-08-01"),
      ugDegree: "B.Tech ECE",
      ugInstitution: "Osmania University",
      ugYear: 2012,
      pgDegree: "M.Tech Signal Processing",
      pgInstitution: "NIT Warangal",
      pgYear: 2014,
      completenessScore: 58.0, // < 60% — will trigger nudge
    },
  });

  const profile4 = await prisma.facultyProfile.upsert({
    where: { userId: faculty4.id },
    update: {},
    create: {
      userId: faculty4.id,
      firstName: "Suresh",
      lastName: "Nair",
      dateOfBirth: new Date("1978-02-19"),
      phone: "+91-9845004004",
      designation: "Professor",
      joiningDate: new Date("2008-06-01"),
      ugDegree: "B.Tech CSE",
      ugInstitution: "Kerala University",
      ugYear: 2000,
      pgDegree: "M.Tech CSE",
      pgInstitution: "Cochin University of Science and Technology",
      pgYear: 2002,
      phdTitle: "Distributed Consensus Algorithms for Blockchain Networks",
      phdInstitution: "GITAM University",
      phdYear: 2014,
      orcidId: "0000-0001-1111-2222",
      scopusAuthorId: "57200000004",
      googleScholarId: "NairSureshGIT",
      completenessScore: 78.0,
    },
  });
  console.log("  ✓ Faculty profiles");

  // ------------------------------------------------------------------
  // CLUSTER 2 — TEACHING ASSIGNMENTS
  // ------------------------------------------------------------------
  const assign1 = await prisma.teachingAssignment.create({
    data: {
      profileId: profile1.id,
      courseCode: "CS601",
      courseName: "Deep Learning",
      academicYear: "2025-26",
      semester: "ODD",
      section: "A",
      contactHours: 48,
      attendancePercent: 88.5,
      feedbackScore: 4.3,
      lessonPlanStatus: ApprovalStatus.APPROVED,
    },
  });
  await prisma.teachingAssignment.create({
    data: {
      profileId: profile1.id,
      courseCode: "CS401",
      courseName: "Machine Learning",
      academicYear: "2025-26",
      semester: "ODD",
      section: "B",
      contactHours: 48,
      attendancePercent: 91.2,
      feedbackScore: 4.5,
      lessonPlanStatus: ApprovalStatus.APPROVED,
    },
  });
  await prisma.teachingAssignment.create({
    data: {
      profileId: profile2.id,
      courseCode: "CS501",
      courseName: "Computer Networks",
      academicYear: "2025-26",
      semester: "ODD",
      section: "A",
      contactHours: 48,
      attendancePercent: 79.4,
      feedbackScore: 2.8, // < 3.0 — will trigger alert
      lessonPlanStatus: ApprovalStatus.PENDING_HOD,
    },
  });
  await prisma.teachingAssignment.create({
    data: {
      profileId: profile4.id,
      courseCode: "CS301",
      courseName: "Data Structures & Algorithms",
      academicYear: "2025-26",
      semester: "ODD",
      section: "A",
      contactHours: 60,
      attendancePercent: 94.1,
      feedbackScore: 4.7,
      lessonPlanStatus: ApprovalStatus.APPROVED,
    },
  });

  // CO-PO Mappings for assign1
  await prisma.coPoMapping.createMany({
    data: [
      { assignmentId: assign1.id, co: "CO1", po: "PO1", correlationLevel: 3 },
      { assignmentId: assign1.id, co: "CO2", po: "PO2", correlationLevel: 2 },
      { assignmentId: assign1.id, co: "CO3", po: "PO5", correlationLevel: 3 },
    ],
  });

  // Remedial session
  await prisma.remedialSession.create({
    data: {
      assignmentId: assign1.id,
      date: new Date("2025-10-15"),
      topic: "Backpropagation and Gradient Descent — revisited",
      studentsCount: 12,
      notes:
        "Students struggling with chain rule application in deep networks.",
    },
  });
  console.log("  ✓ Teaching assignments, CO-PO mappings, remedial sessions");

  // ------------------------------------------------------------------
  // CLUSTER 3 — RESEARCH & INNOVATION
  // ------------------------------------------------------------------
  const pub1 = await prisma.publication.create({
    data: {
      profileId: profile1.id,
      type: PublicationType.JOURNAL,
      title: "Attention-Based U-Net for Multi-Class Medical Image Segmentation",
      doi: "10.1016/j.media.2024.102987",
      issn: "1361-8415",
      journal: "Medical Image Analysis",
      year: 2024,
      volume: "94",
      pages: "102987",
      indexing: PublicationIndexing.SCI,
      impactFactor: 10.9,
      authors: ["Priya Sharma", "Rajan Mehta", "V. Krishnamurthy"],
      approvalStatus: ApprovalStatus.APPROVED,
      source: RecordSource.NATIVE,
    },
  });

  const pub2 = await prisma.publication.create({
    data: {
      profileId: profile1.id,
      type: PublicationType.CONFERENCE,
      title: "Federated Learning for Privacy-Preserving Medical Diagnostics",
      doi: "10.1109/CVPR.2025.00412",
      conference: "IEEE CVPR 2025",
      year: 2025,
      indexing: PublicationIndexing.SCOPUS,
      authors: ["Priya Sharma", "Ananya Reddy"],
      approvalStatus: ApprovalStatus.PENDING_HOD,
      source: RecordSource.NATIVE,
    },
  });

  await prisma.publication.create({
    data: {
      profileId: profile2.id,
      type: PublicationType.JOURNAL,
      title: "Low-Power RISC-V Core for Edge AI Inference",
      doi: "10.1145/3620666.3651342",
      issn: "0004-5411",
      journal: "Journal of the ACM",
      year: 2024,
      volume: "71",
      issue: "3",
      pages: "1–28",
      indexing: PublicationIndexing.SCI,
      impactFactor: 6.1,
      authors: ["Rajan Mehta", "K. Sundararajan"],
      approvalStatus: ApprovalStatus.APPROVED,
      source: RecordSource.NATIVE,
    },
  });

  await prisma.publication.create({
    data: {
      profileId: profile4.id,
      type: PublicationType.JOURNAL,
      title:
        "Byzantine-Fault-Tolerant BFT Consensus for Permissioned Blockchains",
      doi: "10.1109/TPDS.2023.3301112",
      journal: "IEEE Transactions on Parallel and Distributed Systems",
      year: 2023,
      indexing: PublicationIndexing.SCI,
      impactFactor: 5.3,
      authors: ["Suresh Nair", "P. Venkatesh", "Rajan Mehta"],
      approvalStatus: ApprovalStatus.APPROVED,
      source: RecordSource.MIGRATED,
    },
  });

  // Research grants
  await prisma.researchGrant.create({
    data: {
      profileId: profile1.id,
      title:
        "AI-Powered Early Detection of Diabetic Retinopathy in Rural India",
      agency: "Department of Science & Technology (DST), Govt. of India",
      amount: 4200000,
      isPrincipalInvestigator: true,
      startDate: new Date("2023-04-01"),
      endDate: new Date("2026-03-31"),
      status: ProjectStatus.ONGOING,
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });
  await prisma.researchGrant.create({
    data: {
      profileId: profile4.id,
      title: "Scalable Blockchain Infrastructure for Digital Public Records",
      agency: "Ministry of Electronics & IT (MeitY)",
      amount: 7500000,
      isPrincipalInvestigator: true,
      startDate: new Date("2022-01-01"),
      endDate: new Date("2025-12-31"),
      status: ProjectStatus.ONGOING,
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  // Patent
  await prisma.patent.create({
    data: {
      profileId: profile1.id,
      title:
        "System and Method for Real-Time Tumour Boundary Detection Using Hybrid CNN-Transformer",
      applicationNumber: "202341056789",
      filingDate: new Date("2023-08-15"),
      status: PatentStatus.PUBLISHED,
      country: "India",
      inventors: ["Priya Sharma", "Rajan Mehta"],
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  // PhD Scholar
  await prisma.phDScholar.create({
    data: {
      profileId: profile1.id,
      scholarName: "Kavya Menon",
      registrationNo: "REG-PHD-2022-CSE-011",
      topic: "Explainable AI for Clinical Decision Support Systems",
      registrationDate: new Date("2022-08-01"),
      status: PhDStatus.COURSEWORK,
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });
  await prisma.phDScholar.create({
    data: {
      profileId: profile4.id,
      scholarName: "Akash Patel",
      registrationNo: "REG-PHD-2021-CSE-005",
      topic: "Cross-Chain Interoperability Protocols",
      registrationDate: new Date("2021-01-15"),
      status: PhDStatus.SYNOPSIS_SUBMITTED,
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });
  console.log("  ✓ Publications, grants, patents, PhD scholars");

  // ------------------------------------------------------------------
  // CLUSTER 4 — ACHIEVEMENTS & RECOGNITION
  // ------------------------------------------------------------------
  await prisma.award.create({
    data: {
      profileId: profile1.id,
      title: "Best Researcher Award",
      awardingBody: "GITAM University",
      level: AwardLevel.UNIVERSITY,
      year: 2024,
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });
  await prisma.award.create({
    data: {
      profileId: profile4.id,
      title: "Young Scientist Award — Computer Science",
      awardingBody: "Indian National Science Academy",
      level: AwardLevel.NATIONAL,
      year: 2023,
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  await prisma.invitedTalk.create({
    data: {
      profileId: profile1.id,
      title: "Privacy and Fairness in Medical AI: Open Challenges",
      event: "International Conference on AI in Healthcare (ICAIH 2024)",
      institution: "IIT Delhi",
      level: AwardLevel.NATIONAL,
      date: new Date("2024-11-20"),
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  await prisma.professionalMembership.create({
    data: {
      profileId: profile1.id,
      body: "IEEE",
      membershipType: "Senior Member",
      membershipId: "SM-94123456",
      joinedYear: 2019,
    },
  });
  await prisma.professionalMembership.create({
    data: {
      profileId: profile4.id,
      body: "ACM",
      membershipType: "Senior Member",
      membershipId: "ACM-78234567",
      joinedYear: 2016,
    },
  });

  await prisma.editorialRole.create({
    data: {
      profileId: profile4.id,
      journal: "IEEE Transactions on Blockchain",
      role: "Reviewer",
      since: 2021,
    },
  });
  console.log("  ✓ Awards, invited talks, memberships, editorial roles");

  // ------------------------------------------------------------------
  // CLUSTER 5 — FACULTY DEVELOPMENT & GROWTH
  // ------------------------------------------------------------------
  await prisma.facultyDevelopment.create({
    data: {
      profileId: profile1.id,
      name: "Advanced Deep Learning with PyTorch — GIAN Course",
      organizer: "IIT Bombay",
      startDate: new Date("2024-12-09"),
      endDate: new Date("2024-12-13"),
      durationDays: 5,
      role: FDPRole.PARTICIPANT,
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });
  await prisma.facultyDevelopment.create({
    data: {
      profileId: profile2.id,
      name: "VLSI Design Automation — FDP",
      organizer: "GITAM School of Technology, Bengaluru",
      startDate: new Date("2025-01-06"),
      endDate: new Date("2025-01-10"),
      durationDays: 5,
      role: FDPRole.ORGANIZER,
      participantCount: 42,
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });
  await prisma.facultyDevelopment.create({
    data: {
      profileId: profile3.id,
      name: "NPTEL Local Chapter Coordinator Workshop",
      organizer: "NPTEL",
      startDate: new Date("2025-02-17"),
      endDate: new Date("2025-02-18"),
      durationDays: 2,
      role: FDPRole.PARTICIPANT,
      approvalStatus: ApprovalStatus.PENDING_HOD, // pending — auto-approve test case
    },
  });

  await prisma.mOOCCompletion.create({
    data: {
      profileId: profile1.id,
      courseName: "Probabilistic Graphical Models",
      platform: "Coursera (Stanford)",
      completionDate: new Date("2024-09-30"),
      grade: "94.5%",
      durationWeeks: 11,
    },
  });
  await prisma.mOOCCompletion.create({
    data: {
      profileId: profile3.id,
      courseName: "Digital Signal Processing",
      platform: "NPTEL",
      completionDate: new Date("2025-01-15"),
      grade: "Elite + Gold",
      durationWeeks: 12,
    },
  });

  await prisma.internationalVisit.create({
    data: {
      profileId: profile1.id,
      country: "United States",
      institution: "MIT — Computer Science & AI Lab",
      purpose:
        "Collaborative research on federated learning with Prof. M. Kellis",
      startDate: new Date("2024-06-01"),
      endDate: new Date("2024-06-30"),
      fundingSource: "DST-SERB International Travel Support",
    },
  });
  console.log("  ✓ FDPs, MOOCs, international visits");

  // ------------------------------------------------------------------
  // CLUSTER 6 — ADMINISTRATIVE & LIFECYCLE
  // ------------------------------------------------------------------
  await prisma.aPAR.create({
    data: {
      profileId: profile1.id,
      academicYear: "2024-25",
      status: APARStatus.COMPLETED,
      teachingSelf: {
        courses: 3,
        avgFeedback: 4.4,
        attendanceMaintained: true,
      },
      researchSelf: { publications: 2, grants: 1, patents: 1 },
      adminSelf: { committees: 2, examDuties: 3 },
      selfComments:
        "Successfully completed DST project milestone 2. Planning CVPR submission.",
      submittedAt: new Date("2025-03-15"),
      hodGrade: "Outstanding",
      hodComments: "Exceptional research output and student mentoring.",
      hodReviewedAt: new Date("2025-03-20"),
      deanGrade: "Outstanding",
      deanReviewedAt: new Date("2025-03-25"),
      finalGrade: "Outstanding",
      completedAt: new Date("2025-03-28"),
      apiScore: 87.5,
      promotionEligible: true,
    },
  });

  await prisma.aPAR.create({
    data: {
      profileId: profile4.id,
      academicYear: "2024-25",
      status: APARStatus.SUBMITTED,
      teachingSelf: { courses: 2, avgFeedback: 4.7 },
      researchSelf: { publications: 1, grants: 1 },
      selfComments:
        "MeitY project on track. Two journal submissions under review.",
      submittedAt: new Date("2025-03-10"),
    },
  });

  await prisma.committeeRole.create({
    data: {
      profileId: profile1.id,
      committeeName: "Board of Studies — CSE",
      role: "Member",
      startYear: 2022,
    },
  });
  await prisma.committeeRole.create({
    data: {
      profileId: profile1.id,
      committeeName: "IQAC Internal Quality Cell — School of Technology",
      role: "Faculty Representative",
      startYear: 2023,
    },
  });

  await prisma.examDuty.create({
    data: {
      profileId: profile1.id,
      examName: "End Semester Examinations — Nov/Dec 2025",
      role: "Invigilator",
      date: new Date("2025-11-18"),
    },
  });

  await prisma.leaveRecord.create({
    data: {
      profileId: profile1.id,
      type: LeaveType.DUTY,
      startDate: new Date("2025-11-20"),
      endDate: new Date("2025-11-20"),
      days: 1,
      reason: "IEEE Conference attendance — ICAIH 2024, IIT Delhi",
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });
  console.log("  ✓ APARs, committee roles, exam duties, leave records");

  // ------------------------------------------------------------------
  // APPROVAL RECORDS (audit trail of transitions)
  // ------------------------------------------------------------------
  await prisma.approvalRecord.create({
    data: {
      actorId: hodCSE_BLR.id,
      publicationId: pub1.id,
      fromStatus: ApprovalStatus.PENDING_HOD,
      toStatus: ApprovalStatus.PENDING_DEAN,
      action: "APPROVED",
      comments: "Verified — SCI journal with IF > 10. Escalating to Dean.",
    },
  });
  await prisma.approvalRecord.create({
    data: {
      actorId: deanBLR.id,
      publicationId: pub1.id,
      fromStatus: ApprovalStatus.PENDING_DEAN,
      toStatus: ApprovalStatus.APPROVED,
      action: "APPROVED",
      comments: "Exceptional publication. PRAJNA score updated.",
    },
  });
  console.log("  ✓ Approval records");

  // ------------------------------------------------------------------
  // PRAJNA SCORES
  // ------------------------------------------------------------------
  await prisma.prajnaScore.createMany({
    data: [
      {
        profileId: profile1.id,
        total: 84.2,
        tier: ScoreTier.PLATINUM,
        teachingScore: 22.1, // 25% dim — 88.4% of max
        researchScore: 28.5, // 30% dim — 95.0% of max
        developmentScore: 16.8, // 20% dim — 84.0% of max
        achievementsScore: 8.2, // 10% dim
        adminScore: 4.1, // 10% dim
        completenessBonus: 4.5, // 5% dim
        departmentRank: 1,
        schoolRank: 1,
        campusRank: 2,
      },
      {
        profileId: profile2.id,
        total: 67.3,
        tier: ScoreTier.GOLD,
        teachingScore: 17.5,
        researchScore: 23.8,
        developmentScore: 14.2,
        achievementsScore: 5.8,
        adminScore: 4.5,
        completenessBonus: 1.5,
        departmentRank: 2,
        schoolRank: 3,
        campusRank: 5,
      },
      {
        profileId: profile3.id,
        total: 38.6,
        tier: ScoreTier.BRONZE,
        teachingScore: 16.2,
        researchScore: 8.4,
        developmentScore: 9.0,
        achievementsScore: 2.0,
        adminScore: 1.0,
        completenessBonus: 2.0,
        departmentRank: 1,
        schoolRank: 5,
        campusRank: 9,
      },
      {
        profileId: profile4.id,
        total: 79.1,
        tier: ScoreTier.GOLD,
        teachingScore: 23.5,
        researchScore: 26.6,
        developmentScore: 13.0,
        achievementsScore: 9.0,
        adminScore: 4.0,
        completenessBonus: 3.0,
        departmentRank: 1,
        schoolRank: 1,
        campusRank: 1,
      },
    ],
  });
  console.log("  ✓ PRAJNA scores & tiers");

  // ------------------------------------------------------------------
  // APPRECIATION BADGES (Director → faculty)
  // ------------------------------------------------------------------
  await prisma.appreciationBadge.create({
    data: {
      senderId: director.id,
      recipientId: faculty1.id,
      message:
        "Outstanding research impact — your DST project is a model for AI in healthcare. Keep inspiring! 🌟",
    },
  });
  console.log("  ✓ Appreciation badges");

  // ------------------------------------------------------------------
  // AI CONVERSATIONS (private to faculty)
  // ------------------------------------------------------------------
  const conv1 = await prisma.aIConversation.create({
    data: {
      userId: faculty1.id,
      sentimentScore: 0.72,
    },
  });
  await prisma.aIMessage.createMany({
    data: [
      {
        conversationId: conv1.id,
        role: "assistant",
        content:
          "Good morning, Priya! 🌅 You have 2 classes today — Deep Learning (CS601-A at 9 AM) and Machine Learning (CS401-B at 2 PM). Your CVPR submission deadline is in 18 days. You're currently ranked #1 in the department with a PRAJNA score of 84.2 (Platinum). One action to move you closer to PRAJNA Fellow: submit your pending APAR for 2025-26.",
      },
      {
        conversationId: conv1.id,
        role: "user",
        content: "What should I focus on to reach PRAJNA Fellow this year?",
      },
      {
        conversationId: conv1.id,
        role: "assistant",
        content:
          "You need 96+ to reach PRAJNA Fellow — you're at 84.2, so a gap of ~12 points. The highest-leverage moves: (1) Get your CVPR 2025 paper approved (+2.5 research points), (2) Complete your 2025-26 APAR (+1.8 admin points), (3) Organise one FDP this semester (+1.5 development points), and (4) Finish your profile — 3 fields still empty (+0.5 completeness bonus). That gets you to ~90.5. For the final stretch, a second SCI publication or an international grant would push you over 96.",
      },
    ],
  });
  console.log("  ✓ AI conversations (private)");

  // ------------------------------------------------------------------
  // DAILY REFLECTION
  // ------------------------------------------------------------------
  await prisma.dailyReflection.create({
    data: {
      profileId: profile1.id,
      date: new Date("2026-03-23"),
      rating: 4,
      reflection:
        "Productive day — wrapped up experiments for CVPR revision. Students in CS601 finally getting backprop.",
    },
  });
  console.log("  ✓ Daily reflection");

  // ------------------------------------------------------------------
  // NOTIFICATIONS
  // ------------------------------------------------------------------
  await prisma.notification.createMany({
    data: [
      {
        userId: faculty1.id,
        title: "APAR 2025-26 is now open",
        body: "Your annual appraisal window opens today. PRAJNA has pre-filled known data. Deadline: 30 April 2026.",
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        idempotencyKey: "APAR-OPEN-2025-26-FAC-CSE-BLR-001",
        sentAt: new Date("2026-03-01T08:00:00Z"),
      },
      {
        userId: faculty3.id,
        title: "Profile completeness is below 60%",
        body: "Your PRAJNA profile is 58% complete. Complete your qualifications and academic IDs to unlock higher scores.",
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        idempotencyKey: "PROFILE-NUDGE-ECE-BLR-001-2026-03",
        sentAt: new Date("2026-03-15T09:00:00Z"),
      },
      {
        userId: faculty2.id,
        title: "Feedback score alert",
        body: "Your feedback score for CS501 is 2.8, below the 3.0 threshold. Your HoD has been notified. Consider scheduling a student consultation session.",
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.SENT,
        idempotencyKey: "FEEDBACK-ALERT-CS501-FAC-CSE-BLR-002",
        sentAt: new Date("2026-02-28T10:00:00Z"),
      },
    ],
  });
  console.log("  ✓ Notifications");

  // ------------------------------------------------------------------
  // AUDIT LOGS
  // ------------------------------------------------------------------
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: faculty1.id,
        action: "PUBLICATION_CREATED",
        entityType: "Publication",
        entityId: pub1.id,
        after: {
          doi: "10.1016/j.media.2024.102987",
          title: "Attention-Based U-Net...",
          status: "PENDING_HOD",
        },
        ipAddress: "10.0.1.42",
      },
      {
        actorId: hodCSE_BLR.id,
        action: "PUBLICATION_APPROVED",
        entityType: "Publication",
        entityId: pub1.id,
        before: { status: "PENDING_HOD" },
        after: { status: "PENDING_DEAN" },
        ipAddress: "10.0.1.10",
      },
      {
        actorId: deanBLR.id,
        action: "PUBLICATION_APPROVED",
        entityType: "Publication",
        entityId: pub1.id,
        before: { status: "PENDING_DEAN" },
        after: { status: "APPROVED" },
        ipAddress: "10.0.1.5",
      },
      {
        actorId: faculty1.id,
        action: "APAR_SUBMITTED",
        entityType: "APAR",
        entityId: "seed-apar-ref",
        after: { academicYear: "2024-25", status: "SUBMITTED" },
        ipAddress: "10.0.1.42",
      },
    ],
  });
  console.log("  ✓ Audit logs");

  console.log("\n✅ Seed complete.");
  console.log("   Campuses: 3 | Schools: 3 | Departments: 4");
  console.log(
    "   Users: 1 Director, 2 Deans, 1 IQAC, 1 SysAdmin, 3 HoDs, 4 Faculty",
  );
  console.log("   Faculty profiles: 4 (Platinum · Gold · Gold · Bronze)");
  console.log("   Publications: 4 | Grants: 2 | Patents: 1 | PhD Scholars: 2");
  console.log("   Awards: 2 | FDPs: 3 | MOOCs: 2 | Teaching Assignments: 4");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
