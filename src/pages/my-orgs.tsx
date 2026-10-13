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
import {
  Alert, Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog, Drawer, Field,
  Input, PageHeader, Select, StatusBadge, Table, TBody, TD, TH, THead, TR,
} from "@neton/application-client-kit";

interface OrgBrief { id: number; name: string; logo: string; role: number; ownerAccountId: number; status: number }
interface OrgDetail { id: number; name: string; logo: string; code: string; inviteCode: string; ownerAccountId: number; status: number; remark: string }
interface MemberView { orgId: number; accountId: number; role: number; status: number; source: number; joinedAt: number | null; nickname: string; avatar: string | null }

const ROLE_LABEL: Record<number, string> = { 1: "主账号", 2: "管理员", 3: "成员" };
const ASSIGNABLE_ROLES = [2, 3];
const isManager = (role: number) => role === 1 || role === 2;

export default function Page() {
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
  }, "组织已创建");

  const joinOrg = () => run(async () => {
    await apiWrite("/app/org/join", "POST", { inviteCode: joinCode.trim() });
    setJoinOpen(false); setJoinCode("");
  }, "已加入组织");

  const saveProfile = () => run(async () => {
    await apiWrite("/app/org/update", "PUT", { id: selectedId, name: editName.trim() });
    setEditOpen(false);
  }, "资料已更新");

  const resetCode = () => run(async () => {
    await apiWrite<string>(`/app/org/reset-invite-code?id=${selectedId}`, "POST");
  }, "邀请码已重置");

  const addMember = () => run(async () => {
    const accountId = Number(addAccountId.trim());
    if (!Number.isFinite(accountId) || accountId <= 0) throw new Error("请输入有效的账号 ID");
    await apiWrite("/app/org/member/add", "POST", { orgId: selectedId, accountId, role: addRole });
    setAddOpen(false); setAddAccountId("");
  }, "成员已添加");

  const changeRole = (m: MemberView, role: number) => run(
    () => apiWrite("/app/org/member/update-role", "PUT", { orgId: selectedId, accountId: m.accountId, role }),
  );

  const removeMember = () => run(async () => {
    if (!removing) return;
    await apiWrite("/app/org/member/remove", "POST", { orgId: selectedId, accountId: removing.accountId });
    setRemoving(null);
  }, "成员已移除");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="ORGANIZATION" title="我的组织" description="创建或加入组织，并在组织内维护成员（主/子账号）" actions={
        <>
          <Button variant="outline" onClick={() => { setJoinCode(""); setJoinOpen(true); }}>加入组织</Button>
          <Button onClick={() => { setCreateName(""); setCreateOpen(true); }}>创建组织</Button>
        </>
      } />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="info">{notice}</Alert> : null}

      <Card>
        <CardHeader><CardTitle>我的组织</CardTitle></CardHeader>
        <CardContent>
          {myOrgs.isPending ? <div className="text-sm text-[var(--muted-foreground)]">加载中…</div> : null}
          {!myOrgs.isPending && orgs.length === 0 ? <div className="text-sm text-[var(--muted-foreground)]">还没有组织，点右上角创建或加入。</div> : null}
          <div className="flex flex-col">
            {orgs.map((org) => (
              <button key={org.id} type="button" onClick={() => setSelectedId(org.id)}
                className={`flex items-center gap-3 border-b border-[var(--border)] py-3 text-left last:border-b-0 ${org.id === selectedId ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-xs">{org.name.slice(0, 1)}</span>
                <span className="min-w-0 flex-1 truncate">{org.name}</span>
                <span className="shrink-0 text-xs">{ROLE_LABEL[org.role] ?? org.role}</span>
                <StatusBadge active={org.status === 1}>{org.status === 1 ? "正常" : "停用"}</StatusBadge>
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
              <span>编号：{selected.id}</span>
              <span>· 我的角色：{ROLE_LABEL[selected.role]}</span>
              {detail.data?.code ? <span>· 编码：{detail.data.code}</span> : null}
            </div>
            {manager && detail.data?.inviteCode ? (
              <div className="flex items-center gap-3">
                <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 font-mono text-sm tracking-widest">{detail.data.inviteCode}</div>
                <Button size="sm" variant="outline" onClick={() => void resetCode()}>重置邀请码</Button>
              </div>
            ) : null}
            {manager ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditName(detail.data?.name ?? ""); setEditOpen(true); }}>编辑资料</Button>
              </div>
            ) : null}
            {detail.data?.remark ? <div className="text-sm text-[var(--muted-foreground)]">{detail.data.remark}</div> : null}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-[var(--foreground)]">成员</div>
                {manager ? <Button size="sm" onClick={() => { setAddAccountId(""); setAddRole(3); setAddOpen(true); }}>添加成员</Button> : null}
              </div>
              <Table>
                <THead><TR><TH>账号 ID</TH><TH>昵称</TH><TH>角色</TH><TH>来源</TH>{manager ? <TH className="text-right">操作</TH> : null}</TR></THead>
                <TBody>
                  {(members.data ?? []).map((m) => (
                    <TR key={m.accountId}>
                      <TD><code className="text-xs">{m.accountId}</code></TD>
                      <TD>{m.nickname || "-"}</TD>
                      <TD>
                        {manager && m.role !== 1 ? (
                          <Select value={String(m.role)} onChange={(event) => void changeRole(m, Number(event.target.value))}>
                            {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                          </Select>
                        ) : <span className="text-xs">{ROLE_LABEL[m.role] ?? m.role}</span>}
                      </TD>
                      <TD className="text-xs text-[var(--muted-foreground)]">{m.source}</TD>
                      {manager ? (
                        <TD className="text-right">
                          {m.role !== 1 ? <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => setRemoving(m)}>移除</button> : null}
                        </TD>
                      ) : null}
                    </TR>
                  ))}
                  {!members.isPending && (members.data ?? []).length === 0 ? (
                    <TR><TD colSpan={manager ? 5 : 4} className="py-4 text-center text-sm text-[var(--muted-foreground)]">暂无成员</TD></TR>
                  ) : null}
                </TBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="创建组织" footer={<>
        <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
        <Button onClick={() => void createOrg()} disabled={!createName.trim()}>创建</Button>
      </>}>
        <Field label="组织名称"><Input value={createName} onChange={(e) => setCreateName(e.target.value)} maxLength={32} autoFocus /></Field>
        <div className="mt-2 text-xs text-[var(--muted-foreground)]">创建后你即为该组织的主账号（OWNER），可邀请 / 分配成员。</div>
      </Drawer>

      <Drawer open={joinOpen} onClose={() => setJoinOpen(false)} title="凭邀请码加入组织" footer={<>
        <Button variant="outline" onClick={() => setJoinOpen(false)}>取消</Button>
        <Button onClick={() => void joinOrg()} disabled={!joinCode.trim()}>加入</Button>
      </>}>
        <Field label="邀请码"><Input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="组织主账号提供的 10 位邀请码" autoFocus /></Field>
      </Drawer>

      <Drawer open={editOpen} onClose={() => setEditOpen(false)} title="编辑组织资料" footer={<>
        <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
        <Button onClick={() => void saveProfile()} disabled={!editName.trim()}>保存</Button>
      </>}>
        <Field label="组织名称"><Input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={32} /></Field>
      </Drawer>

      <Drawer open={addOpen} onClose={() => setAddOpen(false)} title="添加成员" footer={<>
        <Button variant="outline" onClick={() => setAddOpen(false)}>取消</Button>
        <Button onClick={() => void addMember()} disabled={!addAccountId.trim()}>添加</Button>
      </>}>
        <div className="flex flex-col gap-4">
          <Field label="账号 ID"><Input value={addAccountId} onChange={(e) => setAddAccountId(e.target.value)} inputMode="numeric" placeholder="要纳入组织的账号 ID" /></Field>
          <Field label="角色">
            <Select value={String(addRole)} onChange={(e) => setAddRole(Number(e.target.value))}>
              {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </Select>
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog open={Boolean(removing)} title="移除成员" description="将该账号从此组织移除（不影响其账号本身）。" confirmLabel="移除" onCancel={() => setRemoving(null)} onConfirm={() => void removeMember()} />
    </div>
  );
}
