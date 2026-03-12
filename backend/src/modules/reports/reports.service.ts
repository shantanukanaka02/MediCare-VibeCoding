import { prisma } from "../../config/prisma";
import { ReportsRepository } from "./reports.repository";

interface OverviewFilter {
  organizationId: string;
  from?: string;
  to?: string;
}

const round = (value: number): number => Math.round(value * 100) / 100;

export class ReportsService {
  private readonly repository = new ReportsRepository(prisma);

  async overview(input: OverviewFilter) {
    const to = input.to ? new Date(input.to) : new Date();
    const from = input.from ? new Date(input.from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [patientsInflow, triageRaw, appointmentStats, labRows, openApprovals, pendingBilling] = await Promise.all([
      this.repository.countPatientsInRange(input.organizationId, { from, to }),
      this.repository.triageDistribution(input.organizationId, { from, to }),
      this.repository.appointmentStats(input.organizationId, { from, to }),
      this.repository.labTurnaroundRows(input.organizationId, { from, to }),
      this.repository.approvalOpenCount(input.organizationId),
      this.repository.pendingBillingCount(input.organizationId),
    ]);

    const triageDistribution = triageRaw.map((row: any) => ({
      priority: row.priority,
      count: row._count?._all ?? 0,
    }));

    const noShowRate = appointmentStats.total > 0 ? (appointmentStats.noShows / appointmentStats.total) * 100 : 0;

    const labTurnaroundHours =
      labRows.length > 0
        ? round(
            labRows.reduce((acc: number, row: any) => {
              const sampleTs = new Date(row.sampleCollectedAt).getTime();
              const reviewedTs = new Date(row.reviewedAt).getTime();
              return acc + (reviewedTs - sampleTs) / (1000 * 60 * 60);
            }, 0) / labRows.length,
          )
        : 0;

    return {
      range: { from, to },
      clinical: {
        patientsInflow,
        triageDistribution,
      },
      operational: {
        totalAppointments: appointmentStats.total,
        appointmentNoShowRatePercent: round(noShowRate),
        labTurnaroundHoursAvg: labTurnaroundHours,
      },
      compliance: {
        openApprovals,
        pendingBilling,
      },
    };
  }
}
