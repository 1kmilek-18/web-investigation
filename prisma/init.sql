-- Web Investigation 初期マイグレーション (SDD 5.3)
-- Supabase Dashboard → SQL Editor で実行するか、MCP apply_migration で適用

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('single', 'list');

-- CreateEnum
CREATE TYPE "EmptySendBehavior" AS ENUM ('skip', 'sendNotification');

-- CreateEnum
CREATE TYPE "JobRunStatus" AS ENUM ('running', 'stopping', 'completed', 'stopped', 'failed');

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "selector" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "rawContent" TEXT NOT NULL,
    "summary" TEXT,
    "sourceId" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "dailySendTime" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "emptySendBehavior" "EmptySendBehavior" NOT NULL,
    "costLimitMonthly" DOUBLE PRECISION,
    "costWarningRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "JobRunStatus" NOT NULL,
    "articlesCollected" INTEGER NOT NULL DEFAULT 0,
    "articlesSummarized" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metric" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_url_key" ON "Source"("url");
CREATE INDEX "Source_type_idx" ON "Source"("type");
CREATE UNIQUE INDEX "Article_url_key" ON "Article"("url");
CREATE INDEX "Article_collectedAt_idx" ON "Article"("collectedAt");
CREATE INDEX "Article_sourceId_idx" ON "Article"("sourceId");
CREATE INDEX "JobRun_status_idx" ON "JobRun"("status");
CREATE INDEX "JobRun_startedAt_idx" ON "JobRun"("startedAt");
CREATE INDEX "Metric_runId_idx" ON "Metric"("runId");
CREATE INDEX "Metric_metricType_idx" ON "Metric"("metricType");
CREATE INDEX "Metric_recordedAt_idx" ON "Metric"("recordedAt");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_runId_fkey" FOREIGN KEY ("runId") REFERENCES "JobRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
