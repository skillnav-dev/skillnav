import { CopyButton } from "@/components/shared/copy-button";
import type { ApiType } from "@/data/public-api";

/** One `type=` of the public query API: params, fields and a copyable example. */
export function ApiTypeCard({ api }: { api: ApiType }) {
  return (
    <section
      id={api.type}
      className="scroll-mt-24 rounded-xl ring-1 ring-border/40 bg-card p-6 shadow-sm"
    >
      <h3 className="font-mono text-lg font-semibold">type={api.type}</h3>
      <p className="mt-1 text-sm text-foreground/85">{api.zh}</p>
      <p className="text-xs text-muted-foreground">{api.en}</p>

      <table className="mt-4 w-full text-left text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border/60">
            <th className="w-28 py-1.5 pr-4 font-medium">参数 Param</th>
            <th className="py-1.5 font-medium">说明 Description</th>
          </tr>
        </thead>
        <tbody>
          {api.params.map((p) => (
            <tr key={p.name} className="border-b border-border/40 align-top">
              <td className="py-2 pr-4 font-mono text-xs">
                {p.name}
                {p.required && <span className="ml-1 text-destructive">*</span>}
              </td>
              <td className="py-2">
                <div>{p.zh}</div>
                <div className="text-xs text-muted-foreground">{p.en}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 text-xs font-medium text-muted-foreground">
        返回字段 Fields
      </p>
      <p className="mt-1 font-mono text-xs text-foreground/85">
        {api.fields.join(" · ")}
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 ring-1 ring-border">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs">
          GET {api.example}
        </code>
        <CopyButton text={api.example} className="h-7 w-7 shrink-0" />
      </div>
    </section>
  );
}
