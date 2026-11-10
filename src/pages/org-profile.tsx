"use client";
/**
 * 组织资料（C 端独立页）：路由 /organization/:orgId/profile。展示组织基本资料，管理员可修改组织名称。
 * 读 GET /app/org/get/{id}、/app/org/list（拿我的角色）；写 PUT /app/org/update。
 */
import * as React from "react";
import { apiFetch, apiWrite } from "@neton/application-client-runtime/client";
import { useQuery, useQueryClient } from "@neton/application-client-runtime/client-context";
import { useT, type Translate } from "@neton/application-client-runtime/i18n";
import { useTabTitle, useWorkspaceNavigation, useWorkspaceRoute } from "@neton/application-client-runtime/workspace";
import {
  Alert, Button, Card, CardContent, CardHeader, CardTitle, Drawer, Field, Input,
  PageHeader, StatusBadge,
} from "@neton/application-client-kit";

interface OrgBrief { id: number; name: string; role: number; status: number }
interface OrgDetail { id: number; name: string; logo: string; code: string; inviteCode: string; ownerAccountId: number; status: number; remark: string }

const isManager = (role: number) => role === 1 || role === 2;

function roleLabel(t: Translate, role: number): string {
  const key = role === 1 ? "role.owner" : role === 2 ? "role.admin" : role === 3 ? "role.member" : "";
  return key && t.has(key) ? t(key) : String(role);
}

export default function Page() {
  const t = useT("organization");
  useTabTitle(t("profile.title"));
  const route = useWorkspaceRoute();
  const nav = useWorkspaceNavigation();
  const client = useQueryClient();

  const orgIdRaw = route.params.orgId ?? route.query.orgId ?? "";
  const orgId = Number(orgIdRaw);
  const valid = Number.isFinite(orgId) && orgId > 0;

  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editName, setEditName] = React.useState("");

  const myOrgs = useQuery({ queryKey: ["org-my-list"], queryFn: () => apiFetch<OrgBrief[]>("/app/org/list"), enabled: valid });
  const brief = (myOrgs.data ?? []).find((o) => o.id === orgId) ?? null;
  const manager = brief ? isManager(brief.role) : false;
  const myRole = brief?.role ?? 0;

  const detail = useQuery({ queryKey: ["org-detail", orgId], queryFn: () => apiFetch<OrgDetail>(`/app/org/get/${orgId}`), enabled: valid });
  const org = detail.data;

  async function run(action: () => Promise<unknown>, ok?: string) {
    setError(null); setNotice(null);
    try {
      await action();
      if (ok) setNotice(ok);
      void client.invalidateQueries({ queryKey: ["org-detail", orgId] });
      void client.invalidateQueries({ queryKey: ["org-my-list"] });
    } catch (cause) { setError((cause as Error).message); }
  }

  const saveProfile = () => run(async () => {
    await apiWrite("/app/org/update", "PUT", { id: orgId, name: editName.trim() });
    setEditOpen(false);
  }, t("profile.updated"));

  if (!valid) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader eyebrow={t("eyebrow.org")} title={t("profile.title")} description={t("profile.description")} />
        <Alert tone="error">{t("profile.missingOrg")}</Alert>
        <Button variant="outline" onClick={() => nav.open("/organization/my")}>{t("action.backToOrgs")}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={t("eyebrow.org")}
        title={t("profile.title")}
        description={t("profile.description")}
        actions={<>
          <Button size="sm" variant="outline" onClick={() => nav.open("/organization/my")}>{t("action.backToOrgs")}</Button>
          {manager ? <Button size="sm" onClick={() => { setEditName(org?.name ?? brief?.name ?? ""); setEditOpen(true); }}>{t("action.editProfile")}</Button> : null}
        </>}
      />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="info">{notice}</Alert> : null}

      <Card>
        <CardHeader><CardTitle>{org?.name ?? brief?.name ?? t("common.loading")}</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
            <span>{t("profile.id", { id: orgId })}</span>
            <span>· {t("profile.myRole", { role: roleLabel(t, myRole) })}</span>
            {org?.code ? <span>· {t("profile.code", { code: org.code })}</span> : null}
            <StatusBadge active={(org?.status ?? brief?.status) === 1}>{(org?.status ?? brief?.status) === 1 ? t("status.enabled") : t("status.disabled")}</StatusBadge>
          </div>
          <div className="text-sm">
            <span className="text-[var(--muted-foreground)]">{t("profile.remark")}</span>
            <span className="text-[var(--foreground)]">　{org?.remark?.trim() ? org.remark : t("profile.noRemark")}</span>
          </div>
        </CardContent>
      </Card>

      <Drawer open={editOpen} onClose={() => setEditOpen(false)} title={t("profile.editTitle")} footer={<>
        <Button variant="outline" onClick={() => setEditOpen(false)}>{t("action.cancel")}</Button>
        <Button onClick={() => void saveProfile()} disabled={!editName.trim()}>{t("action.save")}</Button>
      </>}>
        <Field label={t("profile.orgName")}><Input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={32} /></Field>
      </Drawer>
    </div>
  );
}
