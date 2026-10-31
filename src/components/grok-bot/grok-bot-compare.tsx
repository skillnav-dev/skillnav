import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SectionHeader } from "@/components/shared/section-header";
import { grokBotCompare } from "@/data/grok-bot";

export function GrokBotCompare() {
  return (
    <section className="space-y-6">
      <SectionHeader
        title="Grok Bot 在 Agent 工具链里的位置"
        description="Skills 和 MCP 是零件，Grok Bot 是能装上这些零件、长期在线的整机"
      />
      <div className="overflow-x-auto rounded-xl ring-1 ring-border/40">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>类型</TableHead>
              <TableHead>是什么</TableHead>
              <TableHead>在哪运行</TableHead>
              <TableHead>最适合</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grokBotCompare.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">
                  {row.href ? (
                    <Link href={row.href} className="text-primary hover:underline">
                      {row.name}
                    </Link>
                  ) : (
                    row.name
                  )}
                </TableCell>
                <TableCell className="whitespace-normal">{row.what}</TableCell>
                <TableCell className="whitespace-normal">{row.runsOn}</TableCell>
                <TableCell className="whitespace-normal">{row.bestFor}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
