"use client";
/**
 * 我的组织（C 端目录页）：组织由管理后台开通（SPEC organization-integration §7.1）。这里只做
 * 「我所属组织」的目录呈现——每个组织显示真实名称、我的角色、状态与组织标识，并提供进入
 * 数据统计 / 组织成员 / 组织资料 的快捷入口。成员维护、组织资料编辑已拆到各自独立页面。
 * 读 GET /app/org/list、/app/org/get/{id}（拿组织标识 code 用于卡片展示）。
 * 鉴权由后端按当前 [Identity] 角色拦截；前端仅做呈现裁剪。
 */
import * as React from "react";
import { apiFetch } from "@neton/application-client-runtime/client";
import { useQuery } from "@neton/application-client-runtime/client-context";
import { useT, type Translate } from "@neton/application-client-runtime/i18n";
import { useTabTitle, useWorkspaceNavigation } from "@neton/application-client-runtime/workspace";
import {
  Button, Card, CardContent, CardHeader, CardTitle, PageHeader, StatusBadge,
} from "@neton/application-client-kit";

interface OrgBrief { id: number; name: string; logo: string; role: number; ownerAccountId: number; status: number }
interface OrgDetail { id: number; name: string; logo: string; code: string; inviteCode: string; ownerAccountId: number; status: number; remark: string }

const isManager = (role: number) => role === 1 || role === 2;

function roleLabel(t: Translate, role: number): string {
  const key = role === 1 ? "role.owner" : role === 2 ? "role.admin" : role === 3 ? "role.member" : "";
  return key && t.has(key) ? t(key) : String(role);
}

export default function Page() {
  const t = useT("organization");
  useTabTitle(t("my.title"));
  const nav = useWorkspaceNavigation();

  const myOrgs = useQuery({ queryKey: ["org-my-list"], queryFn: () => apiFetch<OrgBrief[]>("/app/org/list") });
  const orgs = myOrgs.data ?? [];
  // 逐个组织的 code（组织标识）用于卡片展示；只在目录页按需拉取，失败不阻塞。
  const [codes, setCodes] = React.useState<Record<number, string>>({});
  React.useEffect(() => {
    let alive = true;
    orgs.forEach((org) => {
      if (codes[org.id] !== undefined) return;
      void apiFetch<OrgDetail>(`/app/org/get/${org.id}`)
        .then((d) => { if (alive) setCodes((prev) => ({ ...prev, [org.id]: d.code ?? "" })); })
        .catch(() => { /* code 仅装饰，忽略 */ });
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgs.length]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow={t("eyebrow.org")} title={t("my.title")} description={t("my.description")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("my.cardTitle")}</CardTitle>
          {!myOrgs.isPending && orgs.length > 0
            ? <div className="text-xs text-[var(--muted-foreground)]">{t("my.orgCount", { count: orgs.length })}</div>
            : null}
        </CardHeader>
        <CardContent>
          {myOrgs.isPending ? <div className="text-sm text-[var(--muted-foreground)]">{t("common.loading")}</div> : null}
          {!myOrgs.isPending && orgs.length === 0 ? <div className="text-sm text-[var(--muted-foreground)]">{t("my.empty")}</div> : null}

          <div className="flex flex-col gap-3">
            {orgs.map((org) => {
              const manager = isManager(org.role);
              const code = codes[org.id];
              return (
                <div key={org.id} className="front-surface flex flex-col gap-3 rounded-lg border border-[var(--border)] p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-sm font-semibold text-[var(--foreground)]">{org.name.slice(0, 1)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-base font-semibold text-[var(--foreground)]">{org.name}</span>
                        <StatusBadge active={org.status === 1}>{org.status === 1 ? t("status.enabled") : t("status.disabled")}</StatusBadge>
                        <span className="text-xs text-[var(--muted-foreground)]">{roleLabel(t, org.role)}</span>
                      </div>
                      {code ? <div className="mt-1 text-xs text-[var(--muted-foreground)]">{t("overview.code", { code })}</div> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {manager ? <Button size="sm" variant="outline" onClick={() => nav.open(`/organization/${org.id}/stats`)}>{t("overview.enterStats")}</Button> : null}
                    {manager ? <Button size="sm" variant="outline" onClick={() => nav.open(`/organization/${org.id}/members`)}>{t("overview.enterMembers")}</Button> : null}
                    <Button size="sm" variant="outline" onClick={() => nav.open(`/organization/${org.id}/profile`)}>{t("overview.enterProfile")}</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
