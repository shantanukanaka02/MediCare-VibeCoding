import type { Prisma, PrismaClient } from "@prisma/client";

export class PatientsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(organizationId: string, take: number) {
    return this.prisma.patient.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  async create(
    data: {
      organizationId: string;
      externalRef?: string;
      mrn: string;
      firstNameEnc: string;
      lastNameEnc: string;
      dobEnc: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.patient.create({ data });
  }
}