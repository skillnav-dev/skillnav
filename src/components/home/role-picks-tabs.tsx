"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export interface RoleTab {
  id: string;
  label: string;
  picks: {
    key: string;
    kind: string;
    name: string;
    why: string;
    href: string;
  }[];
}

export function RolePicksTabs({ tabs }: { tabs: RoleTab[] }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
      <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
        按职业发现 · 编辑精选
      </p>
      <Tabs defaultValue={tabs[0].id} className="gap-4">
        <div className="flex justify-center overflow-x-auto">
          <TabsList className="w-max">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="text-xs sm:text-sm"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {tabs.map((t) => (
          <TabsContent key={t.id} value={t.id}>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {t.picks.map((p) => (
                <li key={p.key}>
                  <Link
                    href={p.href}
                    className="group flex h-full flex-col gap-1 rounded-xl p-3 ring-1 ring-border/40 transition-all hover:bg-muted/30 hover:ring-primary/40"
                  >
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {p.kind}
                      </Badge>
                      <span className="truncate text-sm font-medium group-hover:text-primary">
                        {p.name}
                      </span>
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      {p.why}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </TabsContent>
        ))}
      </Tabs>
      <p className="mt-4 text-center text-sm">
        <Link href="/packs" className="text-primary hover:underline">
          想一次装好一整套？看看按场景打包的装机包 →
        </Link>
      </p>
    </div>
  );
}
