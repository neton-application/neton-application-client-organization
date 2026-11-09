"use client";
/**
 * 我的组织（C 端）：组织由管理后台开通（SPEC organization-integration §7.1），这里只做
 * 「我所属组织」的呈现与成员维护——负责人/管理员给本组织建子账号或纳管已有账号，成员只看自己。
 * 读 GET /app/org/list、/app/org/get/{id}、/app/org/member/list?orgId=、/app/member/user/get（取自己的 accountId）；
 * 写 PUT /app/org/update、POST /app/org/member/create（建号，username 由后端按组织标识自动生成）、
 * /add（纳管已有）、/update-role、/remove。
 * C 端自服务创建 / 邀请码加入已下线（§7.1），对应按钮、抽屉与邀请码 UI 一并移除。
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
interface SelfProfile { id: number; username?: string | null; nickname?: string | null }

const ASSIGNABLE_ROLES = [2, 3];
const ROLE_MEMBER = 3;
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

type AddMode = "create" | "existing";

export default function Page() {
  const t = useT("organization");
  useTabTitle(t("my.title"));
  const client = useQueryClient();
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [editOpen, setEditOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<MemberView | null>(null);

  const [editName, setEditName] = React.useState("");
  const [addMode, setAddMode] = React.useState<AddMode>("create");
  const [addAccountId, setAddAccountId] = React.useState("");
  const [addRole, setAddRole] = React.useState(ROLE_MEMBER);
  const [newPassword, setNewPassword] = React.useState("");
  const [newNickname, setNewNickname] = React.useState("");
  const [createdUsername, setCreatedUsername] = React.useState<string | null>(null);

  const selfQ = useQuery({ queryKey: ["account-self"], queryFn: () => apiFetch<SelfProfile>("/app/member/user/get") });
  const myId = selfQ.data?.id ?? null;

  const myOrgs = useQuery({ queryKey: ["org-my-list"], queryFn: () => apiFetch<OrgBrief[]>("/app/org/list") });
  const orgs = myOrgs.data ?? [];
  const selected = orgs.find((o) => o.id === selectedId) ?? null;
  const manager = selected ? isManager(selected.role) : false;
  // 成员（MEMBER）只看自己：不管理成员列表，仅呈现本人这一行。
  const memberOnly = selected ? selected.role === ROLE_MEMBER : false;

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

  const allMembers = members.data ?? [];
  const visibleMembers = React.useMemo(
    () => (memberOnly && myId !== null ? allMembers.filter((m) => m.accountId === myId) : allMembers),
    [allMembers, memberOnly, myId],
  );

  const reload = () => {
    void client.invalidateQueries({ queryKey: ["org-my-list"] });
    void client.invalidateQueries({ queryKey: ["org-detail", selectedId] });
    void client.invalidateQueries({ queryKey: ["org-members", selectedId] });
  };

  async function run(action: () => Promise<unknown>, ok?: string) {
    setError(null); setNotice(null); setCreatedUsername(null);
    try { await action(); if (ok) setNotice(ok); reload(); }
    catch (cause) { setError((cause as Error).message); }
  }

  const saveProfile = () => run(async () => {
    await apiWrite("/app/org/update", "PUT", { id: selectedId, name: editName.trim() });
    setEditOpen(false);
  }, t("toast.updated"));

  function openAdd() {
    setAddMode("create"); setAddAccountId(""); setAddRole(ROLE_MEMBER);
    setNewPassword(""); setNewNickname("");
    setAddOpen(true);
  }

  const createMember = () => run(async () => {
    if (newPassword.length < 8) throw new Error(t("member.passwordShort"));
    const res = await apiWrite<{ username?: string }>("/app/org/member/create", "POST", {
      orgId: selectedId, password: newPassword, nickname: newNickname.trim(), role: addRole,
    });
    setCreatedUsername(res?.username ?? null);
    setAddOpen(false);
  }, t("toast.memberCreated"));

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
      <PageHeader eyebrow={t("eyebrow.org")} title={t("my.title")} description={t("my.description")} />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {createdUsername
        ? <Alert tone="info">{t("toast.memberCreatedWithUsername", { username: createdUsername })}</Alert>
        : notice ? <Alert tone="info">{notice}</Alert> : null}

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
            {manager ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditName(detail.data?.name ?? ""); setEditOpen(true); }}>{t("action.editProfile")}</Button>
              </div>
            ) : null}
            {detail.data?.remark ? <div className="text-sm text-[var(--muted-foreground)]">{detail.data.remark}</div> : null}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-[var(--foreground)]">{t("section.members")}</div>
                {manager ? <Button size="sm" onClick={openAdd}>{t("action.addMember")}</Button> : null}
              </div>
              <div className="overflow-x-auto">
              <Table>
                <THead><TR><TH>{t("field.accountId")}</TH><TH>{t("field.nickname")}</TH><TH>{t("field.role")}</TH><TH>{t("field.source")}</TH>{manager ? <TH className="text-right">{t("field.operations")}</TH> : null}</TR></THead>
                <TBody>
                  {visibleMembers.map((m) => (
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
                  {!members.isPending && visibleMembers.length === 0 ? (
                    <TR><TD colSpan={manager ? 5 : 4} className="py-4 text-center text-sm text-[var(--muted-foreground)]">{t("members.empty")}</TD></TR>
                  ) : null}
                </TBody>
              </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Drawer open={editOpen} onClose={() => setEditOpen(false)} title={t("drawer.editTitle")} footer={<>
        <Button variant="outline" onClick={() => setEditOpen(false)}>{t("action.cancel")}</Button>
        <Button onClick={() => void saveProfile()} disabled={!editName.trim()}>{t("action.save")}</Button>
      </>}>
        <Field label={t("field.orgName")}><Input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={32} /></Field>
      </Drawer>

      <Drawer open={addOpen} onClose={() => setAddOpen(false)} title={t("drawer.addTitle")} footer={<>
        <Button variant="outline" onClick={() => setAddOpen(false)}>{t("action.cancel")}</Button>
        {addMode === "create"
          ? <Button onClick={() => void createMember()} disabled={newPassword.length < 8}>{t("action.create")}</Button>
          : <Button onClick={() => void addMember()} disabled={!addAccountId.trim()}>{t("action.add")}</Button>}
      </>}>
        <div className="flex flex-col gap-4">
          <Field label={t("member.mode")}>
            <Select value={addMode} onChange={(e) => setAddMode(e.target.value as AddMode)}>
              <option value="create">{t("member.modeCreate")}</option>
              <option value="existing">{t("member.modeExisting")}</option>
            </Select>
          </Field>

          {addMode === "create" ? (
            <>
              <Field label={t("field.password")}>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t("drawer.passwordPlaceholder")} autoFocus />
              </Field>
              <Field label={t("field.nickname")}>
                <Input value={newNickname} onChange={(e) => setNewNickname(e.target.value)} maxLength={32} />
              </Field>
              <div className="text-xs text-[var(--muted-foreground)]">{t("drawer.createMemberHint")}</div>
            </>
          ) : (
            <Field label={t("field.accountId")}>
              <Input value={addAccountId} onChange={(e) => setAddAccountId(e.target.value)} inputMode="numeric" placeholder={t("drawer.addAccountIdPlaceholder")} />
            </Field>
          )}

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
