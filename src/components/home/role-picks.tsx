import { ROLES, allRoleRefs } from "@/data/roles";
import { resolvePublishedTools } from "@/lib/data/collections";
import { toolDisplayName, toolHref } from "@/lib/tool-display";
import { RolePicksTabs, type RoleTab } from "@/components/home/role-picks-tabs";

/** "按职业发现": editor picks per role, published listings only (#28). */
export async function RolePicks() {
  const resolved = await resolvePublishedTools(allRoleRefs());
  const byKey = new Map(resolved.map((t) => [`${t.type}:${t.slug}`, t]));

  const tabs: RoleTab[] = ROLES.map((role) => ({
    id: role.id,
    label: role.label,
    picks: role.picks.flatMap((p) => {
      const tool = byKey.get(`${p.type}:${p.slug}`);
      if (!tool) return [];
      return [
        {
          key: `${p.type}:${p.slug}`,
          kind: p.type === "skill" ? "Skill" : "MCP",
          name: toolDisplayName(tool),
          why: p.why,
          href: toolHref(p),
        },
      ];
    }),
  })).filter((t) => t.picks.length > 0);

  if (tabs.length === 0) return null;
  return <RolePicksTabs tabs={tabs} />;
}
