"use client";
/**
 * 我的组织（C 端）：创建 / 凭邀请码加入组织，选中某组织后就地维护其资料与成员。
 * 读 GET /app/org/list、/app/org/get/{id}、/app/org/member/list?orgId=；
 * 写 POST /app/org/create、/app/org/join、/app/org/reset-invite-code、
 *    PUT /app/org/update、POST /app/org/member/add、/update-role、/remove。
 * 鉴权由后端按当前 [Identity] 的角色（MEMBER 读 / ADMIN 写 / OWNER 删）拦截；前端仅做呈现裁剪。
 */
import * as React from "react";
import { apiFetch, apiWrite } from "@neton/application-client-runtime/client";
import { useQuery, useQueryClient } from "@neton/application-client-runtime/client-context";
import { useT, type Translate } from "@neton/application-client-runtime/i18n";
import { useTabTitle } from "@neton/application-client-runtime/workspace";
import {
  Alert, Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog, Drawer, Field,
  Input, PageHeader, Select, StatusBadge, Table, TBody, TD, TH, THead, TR,
} from "@neton/application-client-kit";

interface OrgBrief { id: number; name: string; logo: string; role: number; ownerAccountId: number; status: number }
interface OrgDetail { id: number; name: string; logo: string; code: string; inviteCode: string; ownerAccountId: number; status: number; remark: string }
interface MemberView { orgId: number; accountId: number; role: number; status: number; source: number; joinedAt: number | null; nickname: string; avatar: string | null }

const ASSIGNABLE_ROLES = [2, 3];
const isManager = (role: number) => role === 1 || role === 2;

function roleLabel(t: Translate, role: number): string {
  const key = role === 1 ? "role.owner" : role === 2 ? "role.admin" : role === 3 ? "role.member" : "";
  return key && t.has(key) ? t(key) : String(role);
}

/** OrgMemberSource：1 创建人 / 2 后台分配 / 3 邀请码加入 / 4 后台邀请（仅审计，缺失回退数字）。 */
function sourceLabel(t: Translate, source: number): string {
  const key = `source.${source}`;
  return t.has(key) ? t(key) : String(source);
}

export default function Page() {
  const t = useT("organization");
  useTabTitle(t("my.title"));
  const client = useQueryClient();
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [joinOpen, setJoinOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<MemberView | null>(null);

  const [createName, setCreateName] = React.useState("");
  const [joinCode, setJoinCode] = React.useState("");
  const [editName, setEditName] = React.useState("");
  const [addAccountId, setAddAccountId] = React.useState("");
  const [addRole, setAddRole] = React.useState(3);

  const myOrgs = useQuery({ queryKey: ["org-my-list"], queryFn: () => apiFetch<OrgBrief[]>("/app/org/list") });
  const orgs = myOrgs.data ?? [];
  const selected = orgs.find((o) => o.id === selectedId) ?? null;
  const manager = selected ? isManager(selected.role) : false;

  React.useEffect(() => {
    if (selectedId === null && orgs.length > 0) setSelectedId(orgs[0].id);
  }, [orgs, selectedId]);

  const detail = useQuery({
    queryKey: ["org-detail", selectedId],
    queryFn: () => apiFetch<OrgDetail>(`/app/org/get/${selectedId}`),
    enabled: selectedId !== null,
  });
  const members = useQuery({
    queryKey: ["org-members", selectedId],
    queryFn: () => apiFetch<MemberView[]>(`/app/org/member/list?orgId=${selectedId}`),
    enabled: selectedId !== null,
  });

  const reload = () => {
    void client.invalidateQueries({ queryKey: ["org-my-list"] });
    void client.invalidateQueries({ queryKey: ["org-detail", selectedId] });
    void client.invalidateQueries({ queryKey: ["org-members", selectedId] });
  };

  async function run(action: () => Promise<unknown>, ok?: string) {
    setError(null); setNotice(null);
    try { await action(); if (ok) setNotice(ok); reload(); }
    catch (cause) { setError((cause as Error).message); }
  }

  const createOrg = () => run(async () => {
    await apiWrite("/app/org/create", "POST", { name: createName.trim() });
    setCreateOpen(false); setCreateName("");
  }, t("toast.created"));

  const joinOrg = () => run(async () => {
    await apiWrite("/app/org/join", "POST", { inviteCode: joinCode.trim() });
    setJoinOpen(false); setJoinCode("");
  }, t("toast.joined"));

  const saveProfile = () => run(async () => {
    await apiWrite("/app/org/update", "PUT", { id: selectedId, name: editName.trim() });
    setEditOpen(false);
  }, t("toast.updated"));

  const resetCode = () => run(async () => {
    await apiWrite<string>(`/app/org/reset-invite-code?id=${selectedId}`, "POST");
  }, t("toast.codeReset"));

  const addMember = () => run(async () => {
    const accountId = Number(addAccountId.trim());
    if (!Number.isFinite(accountId) || accountId <= 0) throw new Error(t("member.invalidId"));
    await apiWrite("/app/org/member/add", "POST", { orgId: selectedId, accountId, role: addRole });
    setAddOpen(false); setAddAccountId("");
  }, t("toast.memberAdded"));

  const changeRole = (m: MemberView, role: number) => run(
    () => apiWrite("/app/org/member/update-role", "PUT", { orgId: selectedId, accountId: m.accountId, role }),
  );

  const removeMember = () => run(async () => {
    if (!removing) return;
    await apiWrite("/app/org/member/remove", "POST", { orgId: selectedId, accountId: removing.accountId });
    setRemoving(null);
  }, t("toast.memberRemoved"));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="ORGANIZATION" title={t("my.title")} description={t("my.description")} actions={
        <>
          <Button variant="outline" onClick={() => { setJoinCode(""); setJoinOpen(true); }}>{t("action.join")}</Button>
          <Button onClick={() => { setCreateName(""); setCreateOpen(true); }}>{t("action.createOrg")}</Button>
        </>
      } />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="info">{notice}</Alert> : null}

      <Card>
        <CardHeader><CardTitle>{t("my.cardTitle")}</CardTitle></CardHeader>
        <CardContent>
          {myOrgs.isPending ? <div className="text-sm text-[var(--muted-foreground)]">{t("common.loading")}</div> : null}
          {!myOrgs.isPending && orgs.length === 0 ? <div className="text-sm text-[var(--muted-foreground)]">{t("my.empty")}</div> : null}
          <div className="flex flex-col">
            {orgs.map((org) => (
              <button key={org.id} type="button" onClick={() => setSelectedId(org.id)}
                className={`flex items-center gap-3 border-b border-[var(--border)] py-3 text-left last:border-b-0 ${org.id === selectedId ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-xs">{org.name.slice(0, 1)}</span>
                <span className="min-w-0 flex-1 truncate">{org.name}</span>
                <span className="shrink-0 text-xs">{roleLabel(t, org.role)}</span>
                <StatusBadge active={org.status === 1}>{org.status === 1 ? t("status.enabled") : t("status.disabled")}</StatusBadge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader><CardTitle>{detail.data?.name ?? selected.name}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
              <span>{t("detail.id", { id: selected.id })}</span>
              <span>· {t("detail.myRole", { role: roleLabel(t, selected.role) })}</span>
              {detail.data?.code ? <span>· {t("detail.code", { code: detail.data.code })}</span> : null}
            </div>
            {manager && detail.data?.inviteCode ? (
              <div className="flex items-center gap-3">
                <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 font-mono text-sm tracking-widest">{detail.data.inviteCode}</div>
                <Button size="sm" variant="outline" onClick={() => void resetCode()}>{t("action.resetCode")}</Button>
              </div>
            ) : null}
            {manager ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditName(detail.data?.name ?? ""); setEditOpen(true); }}>{t("action.editProfile")}</Button>
              </div>
            ) : null}
            {detail.data?.remark ? <div className="text-sm text-[var(--muted-foreground)]">{detail.data.remark}</div> : null}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-[var(--foreground)]">{t("section.members")}</div>
                {manager ? <Button size="sm" onClick={() => { setAddAccountId(""); setAddRole(3); setAddOpen(true); }}>{t("action.addMember")}</Button> : null}
              </div>
              <div className="overflow-x-auto">
              <Table>
                <THead><TR><TH>{t("field.accountId")}</TH><TH>{t("field.nickname")}</TH><TH>{t("field.role")}</TH><TH>{t("field.source")}</TH>{manager ? <TH className="text-right">{t("field.operations")}</TH> : null}</TR></THead>
                <TBody>
                  {(members.data ?? []).map((m) => (
                    <TR key={m.accountId}>
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
                      {manager ? (
                        <TD className="text-right">
                          {m.role !== 1 ? <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => setRemoving(m)}>{t("action.remove")}</button> : null}
                        </TD>
                      ) : null}
                    </TR>
                  ))}
                  {!members.isPending && (members.data ?? []).length === 0 ? (
                    <TR><TD colSpan={manager ? 5 : 4} className="py-4 text-center text-sm text-[var(--muted-foreground)]">{t("members.empty")}</TD></TR>
                  ) : null}
                </TBody>
              </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title={t("drawer.createTitle")} footer={<>
        <Button variant="outline" onClick={() => setCreateOpen(false)}>{t("action.cancel")}</Button>
        <Button onClick={() => void createOrg()} disabled={!createName.trim()}>{t("action.create")}</Button>
      </>}>
        <Field label={t("field.orgName")}><Input value={createName} onChange={(e) => setCreateName(e.target.value)} maxLength={32} autoFocus /></Field>
        <div className="mt-2 text-xs text-[var(--muted-foreground)]">{t("drawer.createHint")}</div>
      </Drawer>

      <Drawer open={joinOpen} onClose={() => setJoinOpen(false)} title={t("drawer.joinTitle")} footer={<>
        <Button variant="outline" onClick={() => setJoinOpen(false)}>{t("action.cancel")}</Button>
        <Button onClick={() => void joinOrg()} disabled={!joinCode.trim()}>{t("action.joinConfirm")}</Button>
      </>}>
        <Field label={t("field.inviteCode")}><Input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder={t("drawer.joinPlaceholder")} autoFocus /></Field>
      </Drawer>

      <Drawer open={editOpen} onClose={() => setEditOpen(false)} title={t("drawer.editTitle")} footer={<>
        <Button variant="outline" onClick={() => setEditOpen(false)}>{t("action.cancel")}</Button>
        <Button onClick={() => void saveProfile()} disabled={!editName.trim()}>{t("action.save")}</Button>
      </>}>
        <Field label={t("field.orgName")}><Input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={32} /></Field>
      </Drawer>

      <Drawer open={addOpen} onClose={() => setAddOpen(false)} title={t("drawer.addTitle")} footer={<>
        <Button variant="outline" onClick={() => setAddOpen(false)}>{t("action.cancel")}</Button>
        <Button onClick={() => void addMember()} disabled={!addAccountId.trim()}>{t("action.add")}</Button>
      </>}>
        <div className="flex flex-col gap-4">
          <Field label={t("field.accountId")}><Input value={addAccountId} onChange={(e) => setAddAccountId(e.target.value)} inputMode="numeric" placeholder={t("drawer.addAccountIdPlaceholder")} /></Field>
          <Field label={t("field.role")}>
            <Select value={String(addRole)} onChange={(e) => setAddRole(Number(e.target.value))}>
              {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{roleLabel(t, r)}</option>)}
            </Select>
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog open={Boolean(removing)} title={t("confirm.removeTitle")} description={t("confirm.removeDescription")} confirmLabel={t("action.remove")} onCancel={() => setRemoving(null)} onConfirm={() => void removeMember()} />
    </div>
  );
}
