import type { PrismaClient } from "@prisma/client";

interface DateRange {
  from: Date;
  to: Date;
}

export class ReportsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async countPatientsInRange(organizationId: string, range: DateRange): Promise<number> {
    return this.prisma.patient.count({
      where: {
        organizationId,
        createdAt: {
          gte: range.from,
          lte: range.to,
        },
      },
    });
  }

  async triageDistribution(organizationId: string, range: DateRange) {
    return (this.prisma as any).triageCase.groupBy({
      by: ["priority"],
      where: {
        organizationId,
        createdAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      _count: { _all: true },
    });
  }

  async appointmentStats(organizationId: string, range: DateRange) {
    const [total, noShows] = await Promise.all([
      (this.prisma as any).appointment.count({
        where: {
          organizationId,
          createdAt: {
            gte: range.from,
            lte: range.to,
          },
        },
      }),
      (this.prisma as any).appointment.count({
        where: {
          organizationId,
          status: "NO_SHOW",
          createdAt: {
            gte: range.from,
            lte: range.to,
          },
        },
      }),
    ]);

    return { total, noShows };
  }

  async labTurnaroundRows(organizationId: string, range: DateRange) {
    return (this.prisma as any).labOrder.findMany({
      where: {
        organizationId,
        sampleCollectedAt: { not: null },
        reviewedAt: { not: null },
        createdAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      select: {
        sampleCollectedAt: true,
        reviewedAt: true,
      },
    });
  }

  async approvalOpenCount(organizationId: string): Promise<number> {
    return (this.prisma as any).approval.count({
      where: {
        organizationId,
        status: { in: ["PENDING", "ESCALATED"] },
      },
    });
  }

  async pendingBillingCount(organizationId: string): Promise<number> {
    return (this.prisma as any).billingTrigger.count({
      where: {
        organizationId,
        status: "PENDING",
      },
    });
  }
}
