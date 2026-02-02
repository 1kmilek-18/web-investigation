/**
 * コスト管理ユーティリティ (REQ-COT-001, REQ-COT-002, REQ-COT-003)
 * TSK-SUM-006: コスト管理統合（月次上限チェック）
 * 
 * 機能:
 * - 当月のコスト累計を計算
 * - コスト上限チェック
 * - 警告閾値チェック
 */

import { prisma } from "@/lib/prisma";

/** 当月の開始日時を取得 */
function getCurrentMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

/** 当月のコスト累計を計算（USD） */
export async function getCurrentMonthCost(): Promise<number> {
  const monthStart = getCurrentMonthStart();
  
  const metrics = await prisma.metric.findMany({
    where: {
      metricType: "api_cost_usd",
      recordedAt: {
        gte: monthStart,
      },
    },
  });

  return metrics.reduce((sum, metric) => sum + metric.value, 0);
}

/** コスト上限チェック結果 */
export type CostCheckResult =
  | { allowed: true; currentCost: number; limit: number | null; warningThreshold?: number }
  | { allowed: false; reason: "limit_reached"; currentCost: number; limit: number };

/**
 * コスト上限をチェック
 * @param costLimitMonthly 月次コスト上限（USD）。nullの場合は上限なしとして扱う
 * @param costWarningRatio 警告閾値の比率（0〜1）。デフォルト0.8（80%）
 * @returns 要約を実行可能かどうか、現在のコスト、警告閾値到達フラグ
 */
export async function checkCostLimit(
  costLimitMonthly: number | null,
  costWarningRatio: number = 0.8
): Promise<CostCheckResult & { warningThresholdReached: boolean }> {
  const currentCost = await getCurrentMonthCost();

  // 上限が設定されていない場合は常に許可
  if (costLimitMonthly === null || costLimitMonthly <= 0) {
    return {
      allowed: true,
      currentCost,
      limit: null,
      warningThresholdReached: false,
    };
  }

  // 上限到達チェック
  if (currentCost >= costLimitMonthly) {
    return {
      allowed: false,
      reason: "limit_reached",
      currentCost,
      limit: costLimitMonthly,
      warningThresholdReached: false,
    };
  }

  // 警告閾値チェック
  const warningThreshold = costLimitMonthly * costWarningRatio;
  const warningThresholdReached = currentCost >= warningThreshold;

  return {
    allowed: true,
    currentCost,
    limit: costLimitMonthly,
    warningThreshold,
    warningThresholdReached,
  };
}

/**
 * Settingsからコスト設定を取得してチェック
 * @returns コストチェック結果とSettings情報
 */
export async function checkCostLimitFromSettings(): Promise<
  CostCheckResult & {
    warningThresholdReached: boolean;
    settings: { costLimitMonthly: number | null; costWarningRatio: number };
  }
> {
  // Settingsを取得（シングルトン）
  const settings = await prisma.settings.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  const costLimitMonthly = settings?.costLimitMonthly ?? null;
  const costWarningRatio = settings?.costWarningRatio ?? 0.8;

  const checkResult = await checkCostLimit(costLimitMonthly, costWarningRatio);

  return {
    ...checkResult,
    settings: {
      costLimitMonthly,
      costWarningRatio,
    },
  };
}
