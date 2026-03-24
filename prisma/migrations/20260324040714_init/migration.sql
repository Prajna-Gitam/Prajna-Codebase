-- CreateEnum
CREATE TYPE "CampusCode" AS ENUM ('BENGALURU', 'VISAKHAPATNAM', 'HYDERABAD');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FACULTY', 'HOD', 'DEAN', 'DIRECTOR', 'IQAC_COORDINATOR', 'SYSTEM_ADMIN');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'PENDING_HOD', 'PENDING_DEAN', 'PENDING_DIRECTOR', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RecordSource" AS ENUM ('NATIVE', 'MIGRATED');

-- CreateEnum
CREATE TYPE "PublicationType" AS ENUM ('JOURNAL', 'CONFERENCE', 'BOOK', 'BOOK_CHAPTER');

-- CreateEnum
CREATE TYPE "PublicationIndexing" AS ENUM ('SCI', 'SCOPUS', 'WOS', 'UGC_CARE', 'OTHER');

-- CreateEnum
CREATE TYPE "PatentStatus" AS ENUM ('FILED', 'PUBLISHED', 'GRANTED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ONGOING', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PhDStatus" AS ENUM ('REGISTERED', 'COURSEWORK', 'SYNOPSIS_SUBMITTED', 'THESIS_SUBMITTED', 'AWARDED');

-- CreateEnum
CREATE TYPE "FDPRole" AS ENUM ('PARTICIPANT', 'ORGANIZER', 'RESOURCE_PERSON');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('CASUAL', 'EARNED', 'MEDICAL', 'DUTY', 'MATERNITY', 'OTHER');

-- CreateEnum
CREATE TYPE "AwardLevel" AS ENUM ('UNIVERSITY', 'STATE', 'NATIONAL', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "ScoreTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'PRAJNA_FELLOW');

-- CreateEnum
CREATE TYPE "APARStatus" AS ENUM ('OPEN', 'SUBMITTED', 'HOD_REVIEWED', 'DEAN_REVIEWED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'FALLBACK_SENT');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING_SCAN', 'CLEAN', 'INFECTED');

-- CreateTable
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "code" "CampusCode" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "deanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "hodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "campusId" TEXT NOT NULL,
    "departmentId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "phone" TEXT,
    "photo" TEXT,
    "designation" TEXT NOT NULL,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "ugDegree" TEXT,
    "ugInstitution" TEXT,
    "ugYear" INTEGER,
    "pgDegree" TEXT,
    "pgInstitution" TEXT,
    "pgYear" INTEGER,
    "phdTitle" TEXT,
    "phdInstitution" TEXT,
    "phdYear" INTEGER,
    "orcidId" TEXT,
    "scopusAuthorId" TEXT,
    "googleScholarId" TEXT,
    "vidwanId" TEXT,
    "linkedInUrl" TEXT,
    "completenessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingAssignment" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "section" TEXT,
    "contactHours" INTEGER NOT NULL,
    "attendancePercent" DOUBLE PRECISION,
    "feedbackScore" DOUBLE PRECISION,
    "lessonPlanFile" TEXT,
    "lessonPlanStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoPoMapping" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "co" TEXT NOT NULL,
    "po" TEXT NOT NULL,
    "correlationLevel" INTEGER NOT NULL,

    CONSTRAINT "CoPoMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemedialSession" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "topic" TEXT NOT NULL,
    "studentsCount" INTEGER,
    "notes" TEXT,

    CONSTRAINT "RemedialSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "PublicationType" NOT NULL,
    "title" TEXT NOT NULL,
    "doi" TEXT,
    "issn" TEXT,
    "isbn" TEXT,
    "journal" TEXT,
    "conference" TEXT,
    "publisher" TEXT,
    "year" INTEGER NOT NULL,
    "volume" TEXT,
    "issue" TEXT,
    "pages" TEXT,
    "indexing" "PublicationIndexing" NOT NULL,
    "impactFactor" DOUBLE PRECISION,
    "authors" TEXT[],
    "proofDocumentId" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_HOD',
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchGrant" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "agency" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isPrincipalInvestigator" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "ProjectStatus" NOT NULL DEFAULT 'ONGOING',
    "proofDocumentId" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_HOD',
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patent" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "applicationNumber" TEXT,
    "grantNumber" TEXT,
    "filingDate" TIMESTAMP(3),
    "grantDate" TIMESTAMP(3),
    "status" "PatentStatus" NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "inventors" TEXT[],
    "proofDocumentId" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_HOD',
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhDScholar" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "scholarName" TEXT NOT NULL,
    "registrationNo" TEXT,
    "topic" TEXT NOT NULL,
    "university" TEXT NOT NULL DEFAULT 'GITAM',
    "registrationDate" TIMESTAMP(3),
    "status" "PhDStatus" NOT NULL,
    "awardedDate" TIMESTAMP(3),
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_HOD',
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhDScholar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultancy" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "ProjectStatus" NOT NULL,
    "proofDocumentId" TEXT,
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoU" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "partnerInstitution" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "signedDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "proofDocumentId" TEXT,
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoU_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "awardingBody" TEXT NOT NULL,
    "level" "AwardLevel" NOT NULL,
    "year" INTEGER NOT NULL,
    "proofDocumentId" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_HOD',
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitedTalk" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "level" "AwardLevel" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "proofDocumentId" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_HOD',
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitedTalk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalMembership" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "membershipType" TEXT,
    "membershipId" TEXT,
    "joinedYear" INTEGER NOT NULL,
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialRole" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "journal" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "since" INTEGER NOT NULL,
    "until" INTEGER,
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorialRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyDevelopment" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "role" "FDPRole" NOT NULL,
    "participantCount" INTEGER,
    "certificateDocumentId" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_HOD',
    "autoApproved" BOOLEAN NOT NULL DEFAULT false,
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyDevelopment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MOOCCompletion" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "completionDate" TIMESTAMP(3) NOT NULL,
    "grade" TEXT,
    "durationWeeks" INTEGER,
    "certificateDocumentId" TEXT,
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MOOCCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternationalVisit" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "fundingSource" TEXT,
    "proofDocumentId" TEXT,
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternationalVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRecord" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "reason" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_HOD',
    "hrSystemRef" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APAR" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "status" "APARStatus" NOT NULL DEFAULT 'OPEN',
    "teachingSelf" JSONB,
    "researchSelf" JSONB,
    "adminSelf" JSONB,
    "selfComments" TEXT,
    "submittedAt" TIMESTAMP(3),
    "hodGrade" TEXT,
    "hodComments" TEXT,
    "hodReviewedAt" TIMESTAMP(3),
    "deanGrade" TEXT,
    "deanComments" TEXT,
    "deanReviewedAt" TIMESTAMP(3),
    "finalGrade" TEXT,
    "finalComments" TEXT,
    "completedAt" TIMESTAMP(3),
    "apiScore" DOUBLE PRECISION,
    "promotionEligible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "APAR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeRole" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "committeeName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER,
    "source" "RecordSource" NOT NULL DEFAULT 'NATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommitteeRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamDuty" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamDuty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRecord" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "publicationId" TEXT,
    "grantId" TEXT,
    "patentId" TEXT,
    "phdScholarId" TEXT,
    "awardId" TEXT,
    "invitedTalkId" TEXT,
    "fdpId" TEXT,
    "fromStatus" "ApprovalStatus" NOT NULL,
    "toStatus" "ApprovalStatus" NOT NULL,
    "action" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrajnaScore" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tier" "ScoreTier" NOT NULL DEFAULT 'BRONZE',
    "teachingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "researchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "developmentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "achievementsScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adminScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completenessBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "departmentRank" INTEGER,
    "schoolRank" INTEGER,
    "campusRank" INTEGER,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrajnaScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppreciationBadge" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppreciationBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sentimentScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReflection" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "rating" INTEGER,
    "reflection" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "scanStatus" "DocumentStatus" NOT NULL DEFAULT 'PENDING_SCAN',
    "uploadedBy" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Campus_code_key" ON "Campus"("code");

-- CreateIndex
CREATE UNIQUE INDEX "School_deanId_key" ON "School"("deanId");

-- CreateIndex
CREATE UNIQUE INDEX "School_name_campusId_key" ON "School"("name", "campusId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_hodId_key" ON "Department"("hodId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_schoolId_key" ON "Department"("code", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE INDEX "User_campusId_idx" ON "User"("campusId");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyProfile_userId_key" ON "FacultyProfile"("userId");

-- CreateIndex
CREATE INDEX "TeachingAssignment_profileId_academicYear_idx" ON "TeachingAssignment"("profileId", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "Publication_doi_key" ON "Publication"("doi");

-- CreateIndex
CREATE INDEX "Publication_profileId_idx" ON "Publication"("profileId");

-- CreateIndex
CREATE INDEX "Publication_approvalStatus_idx" ON "Publication"("approvalStatus");

-- CreateIndex
CREATE INDEX "FacultyDevelopment_profileId_idx" ON "FacultyDevelopment"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "APAR_profileId_academicYear_key" ON "APAR"("profileId", "academicYear");

-- CreateIndex
CREATE INDEX "ApprovalRecord_actorId_idx" ON "ApprovalRecord"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "PrajnaScore_profileId_key" ON "PrajnaScore"("profileId");

-- CreateIndex
CREATE INDEX "AppreciationBadge_recipientId_idx" ON "AppreciationBadge"("recipientId");

-- CreateIndex
CREATE INDEX "AIConversation_userId_idx" ON "AIConversation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReflection_profileId_date_key" ON "DailyReflection"("profileId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Document_s3Key_key" ON "Document"("s3Key");

-- CreateIndex
CREATE INDEX "Document_entityType_entityId_idx" ON "Document"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_idempotencyKey_key" ON "Notification"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Notification_userId_status_idx" ON "Notification"("userId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_deanId_fkey" FOREIGN KEY ("deanId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_hodId_fkey" FOREIGN KEY ("hodId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingAssignment" ADD CONSTRAINT "TeachingAssignment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoPoMapping" ADD CONSTRAINT "CoPoMapping_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TeachingAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemedialSession" ADD CONSTRAINT "RemedialSession_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TeachingAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchGrant" ADD CONSTRAINT "ResearchGrant_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patent" ADD CONSTRAINT "Patent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhDScholar" ADD CONSTRAINT "PhDScholar_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultancy" ADD CONSTRAINT "Consultancy_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoU" ADD CONSTRAINT "MoU_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitedTalk" ADD CONSTRAINT "InvitedTalk_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalMembership" ADD CONSTRAINT "ProfessionalMembership_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialRole" ADD CONSTRAINT "EditorialRole_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyDevelopment" ADD CONSTRAINT "FacultyDevelopment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MOOCCompletion" ADD CONSTRAINT "MOOCCompletion_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternationalVisit" ADD CONSTRAINT "InternationalVisit_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRecord" ADD CONSTRAINT "LeaveRecord_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APAR" ADD CONSTRAINT "APAR_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeRole" ADD CONSTRAINT "CommitteeRole_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamDuty" ADD CONSTRAINT "ExamDuty_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "ResearchGrant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_patentId_fkey" FOREIGN KEY ("patentId") REFERENCES "Patent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_phdScholarId_fkey" FOREIGN KEY ("phdScholarId") REFERENCES "PhDScholar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "Award"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_invitedTalkId_fkey" FOREIGN KEY ("invitedTalkId") REFERENCES "InvitedTalk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_fdpId_fkey" FOREIGN KEY ("fdpId") REFERENCES "FacultyDevelopment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrajnaScore" ADD CONSTRAINT "PrajnaScore_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppreciationBadge" ADD CONSTRAINT "AppreciationBadge_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppreciationBadge" ADD CONSTRAINT "AppreciationBadge_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReflection" ADD CONSTRAINT "DailyReflection_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FacultyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
