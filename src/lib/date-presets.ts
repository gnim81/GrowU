export type DatePreset = {
  label: string;
  from: string;
  to: string;
};

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDatePresets(now = new Date()): DatePreset[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const recentThreeMonthsStart = new Date(today);
  recentThreeMonthsStart.setMonth(today.getMonth() - 3);

  return [
    { label: "今年", from: formatDate(yearStart), to: formatDate(today) },
    { label: "本月", from: formatDate(monthStart), to: formatDate(today) },
    { label: "上个月", from: formatDate(lastMonthStart), to: formatDate(lastMonthEnd) },
    { label: "最近三个月", from: formatDate(recentThreeMonthsStart), to: formatDate(today) }
  ];
}

export function presetHref(pathname: string, params: Record<string, string | undefined>, preset: DatePreset) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  query.set("from", preset.from);
  query.set("to", preset.to);

  return `${pathname}?${query.toString()}`;
}
