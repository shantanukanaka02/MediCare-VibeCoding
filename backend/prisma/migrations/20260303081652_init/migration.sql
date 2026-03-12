-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "patients" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "permissions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "refresh_tokens" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workflow_transition_history" ALTER COLUMN "id" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "audit_logs_org_entity_created_at_idx" RENAME TO "audit_logs_organization_id_entity_type_entity_id_created_at_idx";

-- RenameIndex
ALTER INDEX "workflow_transition_history_org_entity_created_at_idx" RENAME TO "workflow_transition_history_organization_id_entity_type_ent_idx";
