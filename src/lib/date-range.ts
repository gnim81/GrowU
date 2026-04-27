const dayMs = 24 * 60 * 60 * 1000;

export function parseDateRange(from?: string, to?: string) {
  if (!from && !to) {
    return undefined;
  }

  const range: { gte?: Date; lte?: Date } = {};

  if (from) {
    range.gte = new Date(`${from}T00:00:00`);
  }

  if (to) {
    range.lte = new Date(`${to}T23:59:59.999`);
  }

  return range;
}

export function validateDateRange(from?: string, to?: string) {
  if (!from || !to) {
    return { ok: true as const };
  }

  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T23:59:59.999`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false as const, error: "日期格式不正确。" };
  }

  if (start > end) {
    return { ok: false as const, error: "开始日期不能晚于结束日期。" };
  }

  const days = Math.floor((end.getTime() - start.getTime()) / dayMs) + 1;

  if (days > 366) {
    return { ok: false as const, error: "区间最大只能选择 1 年，请缩小筛选范围。" };
  }

  return { ok: true as const, days };
}

export function formatDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}
