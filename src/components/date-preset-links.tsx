import Link from "next/link";
import { getDatePresets, presetHref } from "@/lib/date-presets";

export function DatePresetLinks({
  pathname,
  params
}: {
  pathname: string;
  params: Record<string, string | undefined>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {getDatePresets().map((preset) => (
        <Link className="btn btn-secondary py-1.5 text-xs" href={presetHref(pathname, params, preset)} key={preset.label}>
          {preset.label}
        </Link>
      ))}
    </div>
  );
}
