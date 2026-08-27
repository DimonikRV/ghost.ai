-- CreateTable
CREATE TABLE "export_runs" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "blob_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "export_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "export_runs_run_id_key" ON "export_runs"("run_id");

-- CreateIndex
CREATE INDEX "export_runs_run_id_idx" ON "export_runs"("run_id");

-- CreateIndex
CREATE INDEX "export_runs_user_id_project_id_idx" ON "export_runs"("user_id", "project_id");
