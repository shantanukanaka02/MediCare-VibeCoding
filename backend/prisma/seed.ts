import { createCipheriv, createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources:{
    db:{
      url: process.env.DATABASE_SEED_URL,
    }
  }
});

const ROLE_NAMES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ORG_ADMIN: "ORG_ADMIN",
  PATIENT: "PATIENT",
  RECEPTIONIST: "RECEPTIONIST",
  CARE_NURSE: "CARE_NURSE",
  DOCTOR: "DOCTOR",
  SPECIALIST: "SPECIALIST",
  LAB_TECHNICIAN: "LAB_TECHNICIAN",
  BILLING_OFFICER: "BILLING_OFFICER",
  COMPLIANCE_OFFICER: "COMPLIANCE_OFFICER",
} as const;

type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

const IDS = {
  platformOrganization: "00000000-0000-0000-0000-000000000099",
  organization: "00000000-0000-0000-0000-000000000001",
  secondOrganization: "00000000-0000-0000-0000-000000000002",
  superAdminUser: "10000000-0000-0000-0000-000000000099",
  adminUser: "10000000-0000-0000-0000-000000000001",
  patientUser: "10000000-0000-0000-0000-000000000009",
  nurseUser: "10000000-0000-0000-0000-000000000002",
  receptionistUser: "10000000-0000-0000-0000-000000000003",
  doctorUser: "10000000-0000-0000-0000-000000000004",
  specialistUser: "10000000-0000-0000-0000-000000000005",
  labTechUser: "10000000-0000-0000-0000-000000000006",
  billingUser: "10000000-0000-0000-0000-000000000007",
  complianceUser: "10000000-0000-0000-0000-000000000008",
  secondAdminUser: "10000000-0000-0000-0000-000000000010",
  superAdminRole: "20000000-0000-0000-0000-000000000099",
  adminRole: "20000000-0000-0000-0000-000000000001",
  patientRole: "20000000-0000-0000-0000-000000000009",
  nurseRole: "20000000-0000-0000-0000-000000000002",
  receptionistRole: "20000000-0000-0000-0000-000000000003",
  doctorRole: "20000000-0000-0000-0000-000000000004",
  specialistRole: "20000000-0000-0000-0000-000000000005",
  labTechRole: "20000000-0000-0000-0000-000000000006",
  billingRole: "20000000-0000-0000-0000-000000000007",
  complianceRole: "20000000-0000-0000-0000-000000000008",
  secondAdminRole: "20000000-0000-0000-0000-000000000010",
  refreshToken: "40000000-0000-0000-0000-000000000001",
  refreshFamily: "50000000-0000-0000-0000-000000000001",
  refreshJti: "60000000-0000-0000-0000-000000000001",
  patient: "70000000-0000-0000-0000-000000000001",
  task: "80000000-0000-0000-0000-000000000001",
  secondTenantTask: "80000000-0000-0000-0000-000000000010",
  appointment: "81000000-0000-0000-0000-000000000001",
  triageCase: "82000000-0000-0000-0000-000000000001",
  treatmentPlan: "83000000-0000-0000-0000-000000000001",
  labOrder: "84000000-0000-0000-0000-000000000001",
  approval: "85000000-0000-0000-0000-000000000001",
  billingTrigger: "86000000-0000-0000-0000-000000000001",
  transition: "90000000-0000-0000-0000-000000000001",
  auditPatientCreate: "a0000000-0000-0000-0000-000000000001",
  auditTaskTransition: "a0000000-0000-0000-0000-000000000002",
} as const;

const PERMISSIONS = [
  { resource: "task", action: "read" },
  { resource: "task", action: "create" },
  { resource: "task", action: "update" },
  { resource: "task", action: "transition" },
  { resource: "patient", action: "read" },
  { resource: "patient", action: "create" },
  { resource: "appointment", action: "read" },
  { resource: "appointment", action: "create" },
  { resource: "appointment", action: "transition" },
  { resource: "triage_case", action: "read" },
  { resource: "triage_case", action: "create" },
  { resource: "triage_case", action: "transition" },
  { resource: "treatment_plan", action: "read" },
  { resource: "treatment_plan", action: "create" },
  { resource: "treatment_plan", action: "transition" },
  { resource: "lab_order", action: "read" },
  { resource: "lab_order", action: "create" },
  { resource: "lab_order", action: "transition" },
  { resource: "approval", action: "read" },
  { resource: "approval", action: "create" },
  { resource: "approval", action: "transition" },
  { resource: "billing_trigger", action: "read" },
  { resource: "billing_trigger", action: "create" },
  { resource: "billing_trigger", action: "transition" },
  { resource: "audit_log", action: "read" },
  { resource: "report", action: "read" },
  { resource: "user", action: "read" },
  { resource: "user", action: "create" },
  { resource: "tenant", action: "read" },
  { resource: "tenant", action: "create" },
  { resource: "platform_user", action: "create" },
] as const;

type PermissionKey = `${(typeof PERMISSIONS)[number]["resource"]}:${(typeof PERMISSIONS)[number]["action"]}`;

const ORG_ADMIN_PERMISSION_KEYS = PERMISSIONS
  .filter((permission) => !["tenant", "platform_user"].includes(permission.resource))
  .map((permission) => `${permission.resource}:${permission.action}` as PermissionKey);

const SUPER_ADMIN_PERMISSION_KEYS = PERMISSIONS.map(
  (permission) => `${permission.resource}:${permission.action}` as PermissionKey,
);

const ROLE_PERMISSION_KEYS: Record<RoleName, readonly PermissionKey[]> = {
  SUPER_ADMIN: SUPER_ADMIN_PERMISSION_KEYS,
  ORG_ADMIN: ORG_ADMIN_PERMISSION_KEYS,
  PATIENT: [],
  RECEPTIONIST: ["patient:read", "patient:create", "appointment:read", "appointment:create", "triage_case:read", "triage_case:create"],
  CARE_NURSE: [
    "task:read",
    "task:transition",
    "patient:read",
    "appointment:read",
    "triage_case:read",
    "triage_case:transition",
    "lab_order:read",
    "lab_order:transition",
  ],
  DOCTOR: [
    "task:read",
    "task:update",
    "task:transition",
    "patient:read",
    "appointment:read",
    "triage_case:read",
    "triage_case:transition",
    "treatment_plan:read",
    "treatment_plan:create",
    "treatment_plan:transition",
    "lab_order:read",
    "lab_order:transition",
    "approval:read",
    "approval:create",
    "approval:transition",
    "report:read",
  ],
  SPECIALIST: [
    "patient:read",
    "appointment:read",
    "triage_case:read",
    "treatment_plan:read",
    "treatment_plan:transition",
    "lab_order:read",
    "approval:read",
    "approval:transition",
  ],
  LAB_TECHNICIAN: ["patient:read", "lab_order:read", "lab_order:transition"],
  BILLING_OFFICER: [
    "patient:read",
    "treatment_plan:read",
    "approval:read",
    "billing_trigger:read",
    "billing_trigger:create",
    "billing_trigger:transition",
    "report:read",
  ],
  COMPLIANCE_OFFICER: ["audit_log:read", "report:read"],
};

const toSha256 = (value: string): string => createHash("sha256").update(value).digest("hex");

const encryptField = (plainText: string, encryptionKey: string): string => {
  const key = Buffer.from(encryptionKey, "utf8").subarray(0, 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
};

interface RoleSeed {
  id: string;
  organizationId: string;
  name: RoleName;
  isSystem: boolean;
}

interface UserSeed {
  id: string;
  organizationId: string;
  email: string;
  password: string;
  roleName: RoleName;
}

const roleLookupKey = (organizationId: string, roleName: RoleName): string => `${organizationId}:${roleName}`;

async function main(): Promise<void> {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey || encryptionKey.length < 32) {
    throw new Error("ENCRYPTION_KEY must be set with at least 32 characters before running seed.");
  }

  const org = await prisma.organization.upsert({
    where: { id: IDS.organization },
    update: {
      name: "Default Health Org",
      status: "ACTIVE",
    },
    create: {
      id: IDS.organization,
      name: "Default Health Org",
      status: "ACTIVE",
    },
  });

  const secondOrg = await prisma.organization.upsert({
    where: { id: IDS.secondOrganization },
    update: {
      name: "Second Tenant Health",
      status: "ACTIVE",
    },
    create: {
      id: IDS.secondOrganization,
      name: "Second Tenant Health",
      status: "ACTIVE",
    },
  });

  const platformOrg = await prisma.organization.upsert({
    where: { id: IDS.platformOrganization },
    update: {
      name: "EHCP Platform Control",
      status: "ACTIVE",
    },
    create: {
      id: IDS.platformOrganization,
      name: "EHCP Platform Control",
      status: "ACTIVE",
    },
  });

  const roleSeeds: RoleSeed[] = [
    { id: IDS.superAdminRole, organizationId: platformOrg.id, name: ROLE_NAMES.SUPER_ADMIN, isSystem: true },
    { id: IDS.adminRole, organizationId: org.id, name: ROLE_NAMES.ORG_ADMIN, isSystem: true },
    { id: IDS.patientRole, organizationId: org.id, name: ROLE_NAMES.PATIENT, isSystem: false },
    { id: IDS.receptionistRole, organizationId: org.id, name: ROLE_NAMES.RECEPTIONIST, isSystem: false },
    { id: IDS.nurseRole, organizationId: org.id, name: ROLE_NAMES.CARE_NURSE, isSystem: false },
    { id: IDS.doctorRole, organizationId: org.id, name: ROLE_NAMES.DOCTOR, isSystem: false },
    { id: IDS.specialistRole, organizationId: org.id, name: ROLE_NAMES.SPECIALIST, isSystem: false },
    { id: IDS.labTechRole, organizationId: org.id, name: ROLE_NAMES.LAB_TECHNICIAN, isSystem: false },
    { id: IDS.billingRole, organizationId: org.id, name: ROLE_NAMES.BILLING_OFFICER, isSystem: false },
    { id: IDS.complianceRole, organizationId: org.id, name: ROLE_NAMES.COMPLIANCE_OFFICER, isSystem: false },
    { id: IDS.secondAdminRole, organizationId: secondOrg.id, name: ROLE_NAMES.ORG_ADMIN, isSystem: true },
  ];

  const roleByKey = new Map<string, { id: string; organizationId: string; name: RoleName }>();
  for (const roleSeed of roleSeeds) {
    const role = await prisma.role.upsert({
      where: { organizationId_name: { organizationId: roleSeed.organizationId, name: roleSeed.name } },
      update: { isSystem: roleSeed.isSystem },
      create: {
        id: roleSeed.id,
        organizationId: roleSeed.organizationId,
        name: roleSeed.name,
        isSystem: roleSeed.isSystem,
      },
    });

    roleByKey.set(roleLookupKey(role.organizationId, role.name as RoleName), {
      id: role.id,
      organizationId: role.organizationId,
      name: role.name as RoleName,
    });
  }

  const userSeeds: UserSeed[] = [
    {
      id: IDS.superAdminUser,
      organizationId: platformOrg.id,
      email: "superadmin@platform.health",
      password: "SuperAdmin!12345",
      roleName: ROLE_NAMES.SUPER_ADMIN,
    },
    {
      id: IDS.adminUser,
      organizationId: org.id,
      email: "admin@demo.health",
      password: "ChangeMeStrong!123",
      roleName: ROLE_NAMES.ORG_ADMIN,
    },
    {
      id: IDS.patientUser,
      organizationId: org.id,
      email: "patient@demo.health",
      password: "PatientStrong!123",
      roleName: ROLE_NAMES.PATIENT,
    },
    {
      id: IDS.receptionistUser,
      organizationId: org.id,
      email: "receptionist@demo.health",
      password: "ReceptionStrong!123",
      roleName: ROLE_NAMES.RECEPTIONIST,
    },
    {
      id: IDS.nurseUser,
      organizationId: org.id,
      email: "nurse@demo.health",
      password: "NurseStrong!123",
      roleName: ROLE_NAMES.CARE_NURSE,
    },
    {
      id: IDS.doctorUser,
      organizationId: org.id,
      email: "doctor@demo.health",
      password: "DoctorStrong!123",
      roleName: ROLE_NAMES.DOCTOR,
    },
    {
      id: IDS.specialistUser,
      organizationId: org.id,
      email: "specialist@demo.health",
      password: "SpecialistStrong!123",
      roleName: ROLE_NAMES.SPECIALIST,
    },
    {
      id: IDS.labTechUser,
      organizationId: org.id,
      email: "labtech@demo.health",
      password: "LabStrong!123",
      roleName: ROLE_NAMES.LAB_TECHNICIAN,
    },
    {
      id: IDS.billingUser,
      organizationId: org.id,
      email: "billing@demo.health",
      password: "BillingStrong!123",
      roleName: ROLE_NAMES.BILLING_OFFICER,
    },
    {
      id: IDS.complianceUser,
      organizationId: org.id,
      email: "compliance@demo.health",
      password: "ComplianceStrong!123",
      roleName: ROLE_NAMES.COMPLIANCE_OFFICER,
    },
    {
      id: IDS.secondAdminUser,
      organizationId: secondOrg.id,
      email: "admin2@demo.health",
      password: "ChangeMeStrong!123",
      roleName: ROLE_NAMES.ORG_ADMIN,
    },
  ];

  const passwordHashes = new Map<string, string>();
  for (const userSeed of userSeeds) {
    if (!passwordHashes.has(userSeed.password)) {
      passwordHashes.set(userSeed.password, await bcrypt.hash(userSeed.password, 12));
    }
  }

  const userByEmail = new Map<string, { id: string; organizationId: string; email: string }>();
  for (const userSeed of userSeeds) {
    const passwordHash = passwordHashes.get(userSeed.password);
    if (!passwordHash) {
      throw new Error(`Missing password hash for ${userSeed.email}`);
    }

    const user = await prisma.user.upsert({
      where: {
        organizationId_email: {
          organizationId: userSeed.organizationId,
          email: userSeed.email,
        },
      },
      update: {
        status: "ACTIVE",
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
      },
      create: {
        id: userSeed.id,
        organizationId: userSeed.organizationId,
        email: userSeed.email,
        passwordHash,
        status: "ACTIVE",
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    userByEmail.set(`${user.organizationId}:${user.email}`, {
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
    });
  }

  const permissionRows = await Promise.all(
    PERMISSIONS.map((permission) =>
      prisma.permission.upsert({
        where: {
          resource_action: {
            resource: permission.resource,
            action: permission.action,
          },
        },
        update: {},
        create: {
          resource: permission.resource,
          action: permission.action,
        },
      }),
    ),
  );

  const permissionIdByKey = new Map(permissionRows.map((item) => [`${item.resource}:${item.action}`, item.id]));

  for (const roleSeed of roleSeeds) {
    const role = roleByKey.get(roleLookupKey(roleSeed.organizationId, roleSeed.name));
    if (!role) {
      throw new Error(`Missing role ${roleSeed.name} for organization ${roleSeed.organizationId}`);
    }

    const permissionKeys = ROLE_PERMISSION_KEYS[roleSeed.name];
    for (const key of permissionKeys) {
      const permissionId = permissionIdByKey.get(key);
      if (!permissionId) {
        throw new Error(`Missing permission: ${key}`);
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId,
        },
      });
    }
  }

  for (const userSeed of userSeeds) {
    const user = userByEmail.get(`${userSeed.organizationId}:${userSeed.email}`);
    const role = roleByKey.get(roleLookupKey(userSeed.organizationId, userSeed.roleName));

    if (!user || !role) {
      throw new Error(`Unable to map role assignment for ${userSeed.email}`);
    }

    await prisma.userRole.upsert({
      where: {
        userId_roleId_organizationId: {
          userId: user.id,
          roleId: role.id,
          organizationId: user.organizationId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
        organizationId: user.organizationId,
      },
    });
  }

  const nurseUser = userByEmail.get(`${org.id}:nurse@demo.health`);
  const adminUser = userByEmail.get(`${org.id}:admin@demo.health`);
  const secondAdminUser = userByEmail.get(`${secondOrg.id}:admin2@demo.health`);

  if (!nurseUser || !adminUser || !secondAdminUser) {
    throw new Error("Required seed users are missing");
  }

  const sampleRefreshToken = "sample-refresh-token-nurse-1";

  await prisma.refreshToken.upsert({
    where: { jti: IDS.refreshJti },
    update: {
      tokenHash: toSha256(sampleRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      replacedByJti: null,
    },
    create: {
      id: IDS.refreshToken,
      userId: nurseUser.id,
      organizationId: org.id,
      tokenHash: toSha256(sampleRefreshToken),
      familyId: IDS.refreshFamily,
      jti: IDS.refreshJti,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      replacedByJti: null,
    },
  });

  const patient = await prisma.patient.upsert({
    where: {
      organizationId_mrn: {
        organizationId: org.id,
        mrn: "MRN-1001",
      },
    },
    update: {},
    create: {
      id: IDS.patient,
      organizationId: org.id,
      externalRef: "EHR-EXT-1001",
      mrn: "MRN-1001",
      firstNameEnc: encryptField("John", encryptionKey),
      lastNameEnc: encryptField("Carter", encryptionKey),
      dobEnc: encryptField("1980-04-15", encryptionKey),
    },
  });

  const task = await prisma.task.upsert({
    where: { id: IDS.task },
    update: {
      title: "Initial care-plan call",
      description: "Call patient within 24h of discharge",
      status: "ASSIGNED",
      assigneeUserId: nurseUser.id,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      version: 2,
      createdBy: adminUser.id,
      patientId: patient.id,
      organizationId: org.id,
    },
    create: {
      id: IDS.task,
      organizationId: org.id,
      patientId: patient.id,
      title: "Initial care-plan call",
      description: "Call patient within 24h of discharge",
      status: "ASSIGNED",
      assigneeUserId: nurseUser.id,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      version: 2,
      createdBy: adminUser.id,
    },
  });

  await prisma.task.upsert({
    where: { id: IDS.secondTenantTask },
    update: {
      organizationId: secondOrg.id,
      patientId: null,
      title: "Second tenant private task",
      description: "Must never be visible to tenant 1",
      status: "NEW",
      assigneeUserId: null,
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      version: 1,
      createdBy: secondAdminUser.id,
    },
    create: {
      id: IDS.secondTenantTask,
      organizationId: secondOrg.id,
      patientId: null,
      title: "Second tenant private task",
      description: "Must never be visible to tenant 1",
      status: "NEW",
      assigneeUserId: null,
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      version: 1,
      createdBy: secondAdminUser.id,
    },
  });

  const appointment = await (prisma as any).appointment.upsert({
    where: { id: IDS.appointment },
    update: {
      organizationId: org.id,
      patientId: patient.id,
      providerUserId: nurseUser.id,
      appointmentType: "Follow-up",
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 48 * 60 * 60 * 1000 + 30 * 60 * 1000),
      durationMinutes: 30,
      requiresOperatingRoom: false,
      status: "SCHEDULED",
      createdBy: adminUser.id,
    },
    create: {
      id: IDS.appointment,
      organizationId: org.id,
      patientId: patient.id,
      providerUserId: nurseUser.id,
      appointmentType: "Follow-up",
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 48 * 60 * 60 * 1000 + 30 * 60 * 1000),
      durationMinutes: 30,
      requiresOperatingRoom: false,
      status: "SCHEDULED",
      createdBy: adminUser.id,
    },
  });

  const triageCase = await (prisma as any).triageCase.upsert({
    where: { id: IDS.triageCase },
    update: {
      organizationId: org.id,
      patientId: patient.id,
      intakeState: "TRIAGE_PENDING",
      priority: "HIGH",
      symptomsJson: ["Chest Pain", "Fatigue"],
      vitalsJson: { age: 70, bloodPressureSystolic: 170 },
      assignedDoctorId: null,
      createdBy: nurseUser.id,
    },
    create: {
      id: IDS.triageCase,
      organizationId: org.id,
      patientId: patient.id,
      intakeState: "TRIAGE_PENDING",
      priority: "HIGH",
      symptomsJson: ["Chest Pain", "Fatigue"],
      vitalsJson: { age: 70, bloodPressureSystolic: 170 },
      assignedDoctorId: null,
      createdBy: nurseUser.id,
    },
  });

  const treatmentPlan = await (prisma as any).treatmentPlan.upsert({
    where: { id: IDS.treatmentPlan },
    update: {
      organizationId: org.id,
      patientId: patient.id,
      status: "REVIEW",
      diagnosesJson: ["Hypertension"],
      medicationsJson: [{ name: "Med-A", class: "controlled", dosage: "5mg" }],
      labTestsJson: ["CBC", "Lipid Panel"],
      proceduresJson: ["Cardiology consult"],
      createdBy: adminUser.id,
    },
    create: {
      id: IDS.treatmentPlan,
      organizationId: org.id,
      patientId: patient.id,
      status: "REVIEW",
      diagnosesJson: ["Hypertension"],
      medicationsJson: [{ name: "Med-A", class: "controlled", dosage: "5mg" }],
      labTestsJson: ["CBC", "Lipid Panel"],
      proceduresJson: ["Cardiology consult"],
      createdBy: adminUser.id,
    },
  });

  const labOrder = await (prisma as any).labOrder.upsert({
    where: { id: IDS.labOrder },
    update: {
      organizationId: org.id,
      patientId: patient.id,
      orderedByUserId: adminUser.id,
      testCode: "LAB-CBC",
      testName: "Complete Blood Count",
      status: "PROCESSING",
    },
    create: {
      id: IDS.labOrder,
      organizationId: org.id,
      patientId: patient.id,
      orderedByUserId: adminUser.id,
      testCode: "LAB-CBC",
      testName: "Complete Blood Count",
      status: "PROCESSING",
    },
  });

  const approval = await (prisma as any).approval.upsert({
    where: { id: IDS.approval },
    update: {
      organizationId: org.id,
      patientId: patient.id,
      treatmentPlanId: treatmentPlan.id,
      approvalType: "CONTROLLED_SUBSTANCE",
      status: "PENDING",
      requiredRole: "SENIOR_DOCTOR",
      requestedByUserId: adminUser.id,
      metadataJson: { source: "seed" },
    },
    create: {
      id: IDS.approval,
      organizationId: org.id,
      patientId: patient.id,
      treatmentPlanId: treatmentPlan.id,
      approvalType: "CONTROLLED_SUBSTANCE",
      status: "PENDING",
      requiredRole: "SENIOR_DOCTOR",
      requestedByUserId: adminUser.id,
      metadataJson: { source: "seed" },
    },
  });

  const billingTrigger = await (prisma as any).billingTrigger.upsert({
    where: { id: IDS.billingTrigger },
    update: {
      organizationId: org.id,
      patientId: patient.id,
      treatmentPlanId: treatmentPlan.id,
      sourceEntityType: "treatment_plan",
      sourceEntityId: treatmentPlan.id,
      triggerType: "INSURANCE_PREAUTH",
      status: "PENDING",
      payloadJson: { amount: 1200, currency: "USD" },
      createdBy: adminUser.id,
    },
    create: {
      id: IDS.billingTrigger,
      organizationId: org.id,
      patientId: patient.id,
      treatmentPlanId: treatmentPlan.id,
      sourceEntityType: "treatment_plan",
      sourceEntityId: treatmentPlan.id,
      triggerType: "INSURANCE_PREAUTH",
      status: "PENDING",
      payloadJson: { amount: 1200, currency: "USD" },
      createdBy: adminUser.id,
    },
  });

  await prisma.workflowTransitionHistory.upsert({
    where: { id: IDS.transition },
    update: {
      organizationId: org.id,
      entityType: "task",
      entityId: task.id,
      fromState: "NEW",
      toState: "ASSIGNED",
      event: "assign",
      actorUserId: adminUser.id,
      reason: "Assigned to primary nurse",
    },
    create: {
      id: IDS.transition,
      organizationId: org.id,
      entityType: "task",
      entityId: task.id,
      fromState: "NEW",
      toState: "ASSIGNED",
      event: "assign",
      actorUserId: adminUser.id,
      reason: "Assigned to primary nurse",
    },
  });

  await prisma.auditLog.upsert({
    where: { id: IDS.auditPatientCreate },
    update: {
      organizationId: org.id,
      actorUserId: adminUser.id,
      action: "patient.create",
      entityType: "patient",
      entityId: patient.id,
      beforeJson: Prisma.JsonNull,
      afterJson: { mrn: patient.mrn },
      requestId: "seed-req-001",
      ip: "10.10.1.15",
      userAgent: "EHCP-Seed/1.0",
    },
    create: {
      id: IDS.auditPatientCreate,
      organizationId: org.id,
      actorUserId: adminUser.id,
      action: "patient.create",
      entityType: "patient",
      entityId: patient.id,
      beforeJson: Prisma.JsonNull,
      afterJson: { mrn: patient.mrn },
      requestId: "seed-req-001",
      ip: "10.10.1.15",
      userAgent: "EHCP-Seed/1.0",
    },
  });

  await prisma.auditLog.upsert({
    where: { id: IDS.auditTaskTransition },
    update: {
      organizationId: org.id,
      actorUserId: adminUser.id,
      action: "task.transition",
      entityType: "task",
      entityId: task.id,
      beforeJson: { status: "NEW", version: 1 },
      afterJson: { status: "ASSIGNED", version: 2 },
      requestId: "seed-req-002",
      ip: "10.10.1.15",
      userAgent: "EHCP-Seed/1.0",
    },
    create: {
      id: IDS.auditTaskTransition,
      organizationId: org.id,
      actorUserId: adminUser.id,
      action: "task.transition",
      entityType: "task",
      entityId: task.id,
      beforeJson: { status: "NEW", version: 1 },
      afterJson: { status: "ASSIGNED", version: 2 },
      requestId: "seed-req-002",
      ip: "10.10.1.15",
      userAgent: "EHCP-Seed/1.0",
    },
  });

  console.log("Seed completed with persona roles/users and sample rows across all migrated tables.");

  void appointment;
  void triageCase;
  void labOrder;
  void approval;
  void billingTrigger;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
