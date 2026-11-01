import {
  FileText,
  Globe,
  KeyRound,
  ShieldCheck,
  SquareTerminal,
  TriangleAlert,
} from "lucide-react";
import { FILE_ACCESS_LABELS } from "@/lib/permissions";
import type { ReviewedPermissions } from "@/lib/data/permissions";

function Row({
  icon: Icon,
  label,
  value,
  note,
  warn,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  note?: string;
  warn: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span
            className={
              warn
                ? "font-medium text-amber-700 dark:text-amber-400"
                : "font-medium"
            }
          >
            {value}
          </span>
        </div>
        {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}

/** Editor-reviewed permission boundary of a Skill / MCP server (#24). */
export function PermissionsCard({ data }: { data: ReviewedPermissions }) {
  const p = data.permissions;
  const reviewed = new Date(data.reviewedAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <section className="rounded-xl ring-1 ring-border/40 bg-card p-6 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">权限边界</h2>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          编辑审核于 {reviewed}
        </span>
      </div>
      <div className="divide-y divide-border/40">
        <Row
          icon={FileText}
          label="读写文件"
          value={FILE_ACCESS_LABELS[p.files]}
          note={p.files_note}
          warn={p.files === "write"}
        />
        <Row
          icon={SquareTerminal}
          label="执行命令"
          value={p.exec ? "会" : "不会"}
          note={p.exec_note}
          warn={p.exec}
        />
        <Row
          icon={Globe}
          label="联网"
          value={p.network ? "会" : "不会"}
          note={p.network_note}
          warn={false}
        />
        <Row
          icon={KeyRound}
          label="需要密钥"
          value={p.secrets.length ? p.secrets.join("、") : "不需要"}
          warn={false}
        />
      </div>
      {p.risk_zh && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {p.risk_zh}
        </p>
      )}
    </section>
  );
}
