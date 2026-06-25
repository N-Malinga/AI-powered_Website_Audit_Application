import type { Priority } from "../types";
import { PRIORITY_BADGE } from "../lib/format";

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${PRIORITY_BADGE[priority]}`}
    >
      {priority} priority
    </span>
  );
}
