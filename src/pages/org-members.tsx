"use client";
/**
 * 组织成员（C 端独立页）：从「我的组织」目录进入，路由 /organization/:orgId/members。
 * 管理员可新建子账号、调整角色、移除成员；普通成员只能看到自己。列表新增「登录账号」列
 * （OrgMemberView.username，由后端投影 account.username）。
 * 添加子账号只保留「新建」一种方式（纳管已有账号已下线）：username 由后端按组织标识自动生成。
 * 读 GET /app/org/member/list?orgId=、/app/member/user/get（自己的 accountId）、/app/org/get/{id}（组织名）；
 * 写 POST /app/org/member/create、PUT /app/org/member/update-role、POST /app/org/member/remove。
 */
import * as React from "react";
import { apiFetch, apiWrite } from "@neton/application-client-runtime/client";
import { useQuery, useQueryClient } from "@neton/application-client-runtime/client-context";
import { useT, type Translate } from "@neton/application-client-runtime/i18n";
import { useTabTitle, useWorkspaceNavigation, useWorkspaceRoute } from "@neton/application-client-runtime/workspace";
import { formatDateTime } from "@neton/application-client-runtime/types";
import {
  Alert, Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog, Drawer, Field,
  Input, PageHeader, Select, Table, TBody, TD, TH, THead, TR,
} from "@neton/application-client-kit";

interface OrgBrief { id: number; name: string; role: number; status: number }
interface OrgDetail { id: number; name: string; code: string; status: number; remark: string }
interface MemberView { orgId: number; accountId: number; role: number; status: number; source: number; joinedAt: number | null; username: string; nickname: string; avatar: string | null }
interface SelfProfile { id: number; username?: string | null; nickname?: string | null }

const ASSIGNABLE_ROLES = [2, 3];
const ROLE_MEMBER = 3;
const isManager = (role: number) => role === 1 || role === 2;

function roleLabel(t: Translate, role: number): string {
  const key = role === 1 ? "role.owner" : role === 2 ? "role.admin" : role === 3 ? "role.member" : "";
  return key && t.has(key) ? t(key) : String(role);
}

function sourceLabel(t: Translate, source: number): string {
  const key = `source.${source}`;
  return t.has(key) ? t(key) : String(source);
}

export default function Page() {
  const t = useT("organization");
  useTabTitle(t("members.title"));
  const route = useWorkspaceRoute();
  const nav = useWorkspaceNavigation();
  const client = useQueryClient();

  const orgIdRaw = route.params.orgId ?? route.query.orgId ?? "";
  const orgId = Number(orgIdRaw);
  const valid = Number.isFinite(orgId) && orgId > 0;

  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<MemberView | null>(null);
  const [addRole, setAddRole] = React.useState(ROLE_MEMBER);
  const [newPassword, setNewPassword] = React.useState("");
  const [newNickname, setNewNickname] = React.useState("");
  const [createdUsername, setCreatedUsername] = React.useState<string | null>(null);

  const selfQ = useQuery({ queryKey: ["account-self"], queryFn: () => apiFetch<SelfProfile>("/app/member/user/get"), enabled: valid });
  const myId = selfQ.data?.id ?? null;

  const myOrgs = useQuery({ queryKey: ["org-my-list"], queryFn: () => apiFetch<OrgBrief[]>("/app/org/list"), enabled: valid });
  const brief = (myOrgs.data ?? []).find((o) => o.id === orgId) ?? null;
  const manager = brief ? isManager(brief.role) : false;
  const memberOnly = brief ? brief.role === ROLE_MEMBER : false;

  const detail = useQuery({ queryKey: ["org-detail", orgId], queryFn: () => apiFetch<OrgDetail>(`/app/org/get/${orgId}`), enabled: valid });
  const members = useQuery({ queryKey: ["org-members", orgId], queryFn: () => apiFetch<MemberView[]>(`/app/org/member/list?orgId=${orgId}`), enabled: valid });

  const orgName = detail.data?.name ?? brief?.name ?? "";
  const allMembers = members.data ?? [];
  const visibleMembers = React.useMemo(
    () => (memberOnly && myId !== null ? allMembers.filter((m) => m.accountId === myId) : allMembers),
    [allMembers, memberOnly, myId],
  );

  const reload = () => {
    void client.invalidateQueries({ queryKey: ["org-members", orgId] });
    void client.invalidateQueries({ queryKey: ["org-detail", orgId] });
  };

  async function run(action: () => Promise<unknown>, ok?: string) {
    setError(null); setNotice(null); setCreatedUsername(null);
    try { await action(); if (ok) setNotice(ok); reload(); }
    catch (cause) { setError((cause as Error).message); }
  }

  function openAdd() {
    setAddRole(ROLE_MEMBER); setNewPassword(""); setNewNickname(""); setAddOpen(true);
  }

  const createMember = () => run(async () => {
    if (newPassword.length < 8) throw new Error(t("members.passwordShort"));
    const res = await apiWrite<{ username?: string }>("/app/org/member/create", "POST", {
      orgId, password: newPassword, nickname: newNickname.trim(), role: addRole,
    });
    setCreatedUsername(res?.username ?? null);
    setAddOpen(false);
  }, t("members.created"));

  const changeRole = (m: MemberView, role: number) => run(
    () => apiWrite("/app/org/member/update-role", "PUT", { orgId, accountId: m.accountId, role }),
  );

  const removeMember = () => run(async () => {
    if (!removing) return;
    await apiWrite("/app/org/member/remove", "POST", { orgId, accountId: removing.accountId });
    setRemoving(null);
  }, t("members.removed"));

  if (!valid) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader eyebrow={t("eyebrow.org")} title={t("members.title")} description={t("members.description")} />
        <Alert tone="error">{t("profile.missingOrg")}</Alert>
        <Button variant="outline" onClick={() => nav.open("/organization/my")}>{t("action.backToOrgs")}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={orgName ? t("members.orgLabel", { name: orgName }) : t("eyebrow.org")}
        title={t("members.title")}
        description={t("members.description")}
        actions={<>
          <Button size="sm" variant="outline" onClick={() => nav.open("/organization/my")}>{t("action.backToOrgs")}</Button>
          {manager ? <Button size="sm" onClick={openAdd}>{t("members.addTitle")}</Button> : null}
        </>}
      />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {createdUsername
        ? <Alert tone="info">{t("members.createdWithUsername", { username: createdUsername })}</Alert>
        : notice ? <Alert tone="info">{notice}</Alert> : null}

      <Card>
        <CardHeader><CardTitle>{t("members.title")}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>{t("field.username")}</TH>
                  <TH>{t("field.accountId")}</TH>
                  <TH>{t("field.nickname")}</TH>
                  <TH>{t("field.role")}</TH>
                  <TH>{t("field.source")}</TH>
                  <TH>{t("field.joinedAt")}</TH>
                  {manager ? <TH className="text-right">{t("field.operations")}</TH> : null}
                </TR>
              </THead>
              <TBody>
                {visibleMembers.map((m) => (
                  <TR key={m.accountId}>
                    <TD>{m.username ? <code className="text-xs">{m.username}</code> : <span className="text-xs text-[var(--muted-foreground)]">-</span>}</TD>
                    <TD><code className="text-xs">{m.accountId}</code></TD>
                    <TD>{m.nickname || "-"}</TD>
                    <TD>
                      {manager && m.role !== 1 ? (
                        <Select value={String(m.role)} onChange={(event) => void changeRole(m, Number(event.target.value))}>
                          {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{roleLabel(t, r)}</option>)}
                        </Select>
                      ) : <span className="text-xs">{roleLabel(t, m.role)}</span>}
                    </TD>
                    <TD className="text-xs text-[var(--muted-foreground)]">{sourceLabel(t, m.source)}</TD>
                    <TD className="text-xs text-[var(--muted-foreground)]">{m.joinedAt ? formatDateTime(m.joinedAt) : "-"}</TD>
                    {manager ? (
                      <TD className="text-right">
                        {m.role !== 1 ? <button type="button" className="text-xs text-[var(--destructive)] hover:underline" onClick={() => setRemoving(m)}>{t("action.remove")}</button> : null}
                      </TD>
                    ) : null}
                  </TR>
                ))}
                {!members.isPending && visibleMembers.length === 0 ? (
                  <TR><TD colSpan={manager ? 7 : 6} className="py-4 text-center text-sm text-[var(--muted-foreground)]">{t("members.empty")}</TD></TR>
                ) : null}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Drawer open={addOpen} onClose={() => setAddOpen(false)} title={t("members.addTitle")} footer={<>
        <Button variant="outline" onClick={() => setAddOpen(false)}>{t("action.cancel")}</Button>
        <Button onClick={() => void createMember()} disabled={newPassword.length < 8}>{t("action.create")}</Button>
      </>}>
        <div className="flex flex-col gap-4">
          <Field label={t("field.password")}>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t("members.passwordPlaceholder")} autoFocus />
          </Field>
          <Field label={t("field.nickname")}>
            <Input value={newNickname} onChange={(e) => setNewNickname(e.target.value)} maxLength={32} />
          </Field>
          <Field label={t("field.role")}>
            <Select value={String(addRole)} onChange={(e) => setAddRole(Number(e.target.value))}>
              {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{roleLabel(t, r)}</option>)}
            </Select>
          </Field>
          <div className="text-xs text-[var(--muted-foreground)]">{t("members.createHint")}</div>
        </div>
      </Drawer>

      <ConfirmDialog open={Boolean(removing)} title={t("members.removeTitle")} description={t("members.removeDescription")} confirmLabel={t("action.remove")} onCancel={() => setRemoving(null)} onConfirm={() => void removeMember()} />
    </div>
  );
}
