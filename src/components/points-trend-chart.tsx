import { formatPoints } from "@/lib/format";
import type { TrendChartData } from "@/lib/transaction-trends";

export function PointsTrendChart({ data }: { data: TrendChartData | null }) {
  if (!data || data.series.length === 0 || data.series.every((series) => series.points.length === 0)) {
    return <p className="text-sm text-muted">当前筛选区间暂无趋势数据。</p>;
  }

  const allPoints = data.series.flatMap((series) => series.points);
  const values = allPoints.map((point) => point.total);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);
  const valueRange = maxValue - minValue || 1;
  const sampleCount = data.series[0]?.points.length ?? 0;
  const width = Math.max(720, sampleCount * 56);
  const height = 260;
  const paddingLeft = 44;
  const paddingRight = 20;
  const paddingTop = 24;
  const paddingBottom = 42;
  const xStep = sampleCount > 1 ? (width - paddingLeft - paddingRight) / (sampleCount - 1) : 0;
  const labelStep = Math.max(1, Math.ceil(sampleCount / 6));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          从 {data.startDate} 到 {data.endDate}，采样间隔 {data.sampleDays} 天
        </p>
        <div className="flex flex-wrap gap-3">
          {data.series.map((series) => (
            <div className="flex items-center gap-2 text-sm" key={series.childId}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
              <span>{series.childName}</span>
              <span className="text-muted">{formatPoints(series.points.at(-1)?.total ?? 0)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg className="min-w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="积分趋势图">
          <line x1={paddingLeft} x2={width - paddingRight} y1={height - paddingBottom} y2={height - paddingBottom} stroke="#ECEAF2" />
          <line x1={paddingLeft} x2={paddingLeft} y1={paddingTop} y2={height - paddingBottom} stroke="#ECEAF2" />
          {[maxValue, (maxValue + minValue) / 2, minValue].map((value, index) => {
            const y = height - paddingBottom - ((value - minValue) / valueRange) * (height - paddingTop - paddingBottom);
            return (
              <g key={`${value}-${index}`}>
                <line x1={paddingLeft} x2={width - paddingRight} y1={y} y2={y} stroke="#F4F2FA" />
                <text fill="#6B6880" fontSize="12" textAnchor="end" x={paddingLeft - 8} y={y + 4}>
                  {formatPoints(Math.round(value))}
                </text>
              </g>
            );
          })}
          {data.series.map((series) => {
            const path = series.points
              .map((point, index) => {
                const x = paddingLeft + index * xStep;
                const y = height - paddingBottom - ((point.total - minValue) / valueRange) * (height - paddingTop - paddingBottom);
                return `${index === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ");

            return (
              <g key={series.childId}>
                <path d={path} fill="none" stroke={series.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                {series.points.map((point, index) => {
                  const x = paddingLeft + index * xStep;
                  const y = height - paddingBottom - ((point.total - minValue) / valueRange) * (height - paddingTop - paddingBottom);
                  return <circle cx={x} cy={y} fill={series.color} key={`${series.childId}-${point.date}`} r="3.5" />;
                })}
              </g>
            );
          })}
          {data.series[0]?.points.map((point, index) => {
            if (index % labelStep !== 0 && index !== sampleCount - 1) {
              return null;
            }

            const x = paddingLeft + index * xStep;

            return (
              <text fill="#6B6880" fontSize="11" key={point.date} textAnchor="middle" x={x} y={height - 12}>
                {point.date.slice(5)}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
