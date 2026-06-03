import { PointTransactionType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { buildTransactionsCsv } from "../src/lib/csv";

vi.mock("@/lib/format", () => ({
  formatDateTime: (value: Date) => value.toISOString()
}));

vi.mock("@/lib/points", () => ({
  transactionTypeLabels: {
    BONUS: "加分",
    PENALTY: "减分",
    REWARD: "兑换"
  }
}));

describe("buildTransactionsCsv", () => {
  it("builds transaction CSV with stable Chinese headers and escaped values", () => {
    const csv = buildTransactionsCsv([
      {
        childName: "小明",
        type: PointTransactionType.BONUS,
        itemNameSnapshot: "阅读, 30 分钟",
        points: 5,
        note: "完成《西游记》",
        occurredAt: new Date("2026-06-02T12:00:00.000Z"),
        createdByUsername: "admin"
      }
    ]);

    expect(csv).toContain("孩子,类型,项目,分值,备注,发生时间,记录人");
    expect(csv).toContain('"阅读, 30 分钟"');
    expect(csv).toContain("完成《西游记》");
  });
});
