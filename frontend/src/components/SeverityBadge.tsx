import type { Severity } from "../types";
import { SEVERITY_BADGE } from "../lib/format";

export default function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${SEVERITY_BADGE[severity]}`}
    >
      {severity}
    </span>
  );
}
