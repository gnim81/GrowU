import { addDays, formatDateOnly, startOfDay } from "@/lib/date-range";

const palette = ["#2563EB", "#DC2626", "#059669", "#D97706", "#0F766E", "#7C3AED"];

export type TrendChild = {
  id: string;
  name: string;
  color?: string;
};

export type TrendTransaction = {
  childId: string;
  occurredAt: Date;
  points: number;
};

export type TrendPoint = {
  date: string;
  total: number;
};

export type TrendSeries = {
  childId: string;
  childName: string;
  color: string;
  points: TrendPoint[];
};

export type TrendChartData = {
  sampleDays: number;
  startDate: string;
  endDate: string;
  series: TrendSeries[];
};

function chooseSampleDays(totalDays: number) {
  if (totalDays <= 31) {
    return 2;
  }

  if (totalDays <= 93) {
    return 7;
  }

  return Math.max(1, Math.ceil(totalDays / 16));
}

function buildSampleDates(start: Date, end: Date, sampleDays: number) {
  const dates: Date[] = [];
  let current = startOfDay(start);

  while (current <= end) {
    dates.push(current);
    current = addDays(current, sampleDays);
  }

  if (dates.length === 0 || dates.at(-1)?.getTime() !== startOfDay(end).getTime()) {
    dates.push(startOfDay(end));
  }

  return dates;
}

export function buildTrendChartData({
  children,
  transactions,
  rangeStart,
  rangeEnd
}: {
  children: TrendChild[];
  transactions: TrendTransaction[];
  rangeStart?: Date;
  rangeEnd?: Date;
}): TrendChartData | null {
  if (children.length === 0 || transactions.length === 0) {
    return null;
  }

  const sortedTransactions = [...transactions].sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime());
  const start = rangeStart ? startOfDay(rangeStart) : startOfDay(sortedTransactions[0].occurredAt);
  const end = rangeEnd ? startOfDay(rangeEnd) : startOfDay(sortedTransactions[sortedTransactions.length - 1].occurredAt);

  if (start > end) {
    return null;
  }

  const totalDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const sampleDays = chooseSampleDays(totalDays);
  const sampleDates = buildSampleDates(start, end, sampleDays);

  const series = children.map((child, index) => {
    const childTransactions = sortedTransactions.filter((transaction) => transaction.childId === child.id);
    let cursor = 0;
    let total = 0;

    while (cursor < childTransactions.length && childTransactions[cursor].occurredAt < start) {
      total += childTransactions[cursor].points;
      cursor += 1;
    }

    const points = sampleDates.map((sampleDate) => {
      const sampleEnd = addDays(sampleDate, sampleDays);

      while (cursor < childTransactions.length && childTransactions[cursor].occurredAt < sampleEnd) {
        total += childTransactions[cursor].points;
        cursor += 1;
      }

      return {
        date: formatDateOnly(sampleDate),
        total
      };
    });

    return {
      childId: child.id,
      childName: child.name,
      color: child.color || palette[index % palette.length],
      points
    };
  });

  return {
    sampleDays,
    startDate: formatDateOnly(start),
    endDate: formatDateOnly(end),
    series,
  };
}
