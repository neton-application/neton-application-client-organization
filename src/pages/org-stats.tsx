"use client";
/**
 * 数据统计（C 端独立页）：路由 /organization/:orgId/stats，仅组织管理员（ADMIN/OWNER）可见。
 * 实时派生（不建新表）：总量/在线快照、每日新增（device.createdAt）、每日活跃（device_event 去重近似）。
 * 读 GET /app/device/stats/overview?orgId=、/app/device/stats/daily?orgId=&days=。
 * 无图表库——KPI 卡片 + 纯 CSS 条形趋势 + 分布列表，配色走 CSS 变量。
 */
import * as React from "react";
import { apiFetch } from "@neton/application-client-runtime/client";
import { useQuery } from "@neton/application-client-runtime/client-context";
import { useT, type Translate } from "@neton/application-client-runtime/i18n";
import { useTabTitle, useWorkspaceNavigation, useWorkspaceRoute } from "@neton/application-client-runtime/workspace";
import {
  Alert, Button, Card, CardContent, CardHeader, CardTitle, PageHeader,
} from "@neton/application-client-kit";

interface NameCount { name: string; count: number }
interface DeviceStatsOverview {
  orgId: number; totalDevices: number; onlineDevices: number; offlineDevices: number;
  inactiveDevices: number; disabledDevices: number; onlineRate: number;
  todayNewDevices: number; memberCount: number;
  deviceTypeDistribution: NameCount[]; brandTop: NameCount[]; modelTop: NameCount[]; osVersionTop: NameCount[];
}
interface DailyPoint { date: string; newDevices: number; activeDevices: number }
interface DeviceStatsDaily { orgId: number; days: number; series: DailyPoint[] }

const RANGES = [7, 30, 90] as const;

function deviceTypeLabel(t: Translate, name: string): string {
  const key = `deviceType.${name}`;
  return t.has(key) ? t(key) : name;
}

function Kpi({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="front-surface flex flex-col gap-1 rounded-lg border border-[var(--border)] p-4">
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <span className="text-2xl font-semibold" style={tone ? { color: tone } : { color: "var(--foreground)" }}>{value}</span>
    </div>
  );
}

function Distribution({ title, items, label }: { title: string; items: NameCount[]; label?: (name: string) => string }) {
  const max = items.reduce((m, it) => Math.max(m, it.count), 0);
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-semibold text-[var(--foreground)]">{title}</div>
      {items.length === 0 ? <div className="text-xs text-[var(--muted-foreground)]">—</div> : null}
      {items.map((it) => (
        <div key={it.name} className="flex items-center gap-2">
          <span className="w-28 shrink-0 truncate text-xs text-[var(--muted-foreground)]" title={label ? label(it.name) : it.name}>{label ? label(it.name) : it.name}</span>
          <span className="h-2 flex-1 overflow-hidden rounded bg-[var(--muted)]">
            <span className="block h-full rounded" style={{ width: `${max > 0 ? (it.count / max) * 100 : 0}%`, background: "var(--primary)" }} />
          </span>
          <span className="w-8 shrink-0 text-right text-xs tabular-nums text-[var(--foreground)]">{it.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  const t = useT("organization");
  useTabTitle(t("stats.title"));
  const route = useWorkspaceRoute();
  const nav = useWorkspaceNavigation();

  const orgIdRaw = route.params.orgId ?? route.query.orgId ?? "";
  const orgId = Number(orgIdRaw);
  const valid = Number.isFinite(orgId) && orgId > 0;

  const [days, setDays] = React.useState<number>(30);

  const overview = useQuery({
    queryKey: ["org-stats-overview", orgId],
    queryFn: () => apiFetch<DeviceStatsOverview>(`/app/device/stats/overview?orgId=${orgId}`),
    enabled: valid,
  });
  const daily = useQuery({
    queryKey: ["org-stats-daily", orgId, days],
    queryFn: () => apiFetch<DeviceStatsDaily>(`/app/device/stats/daily?orgId=${orgId}&days=${days}`),
    enabled: valid,
  });

  if (!valid) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader eyebrow={t("eyebrow.org")} title={t("stats.title")} description={t("stats.description")} />
        <Alert tone="error">{t("stats.missingOrg")}</Alert>
        <Button variant="outline" onClick={() => nav.open("/organization/my")}>{t("action.backToOrgs")}</Button>
      </div>
    );
  }

  const ov = overview.data;
  const series = daily.data?.series ?? [];
  const maxBar = series.reduce((m, p) => Math.max(m, p.newDevices, p.activeDevices), 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={t("eyebrow.org")}
        title={t("stats.title")}
        description={t("stats.description")}
        actions={<Button size="sm" variant="outline" onClick={() => nav.open("/organization/my")}>{t("action.backToOrgs")}</Button>}
      />
      {overview.error ? <Alert tone="error">{(overview.error as Error).message}</Alert> : null}

      {overview.isPending || !ov ? (
        <div className="text-sm text-[var(--muted-foreground)]">{t("common.loading")}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label={t("stats.totalDevices")} value={ov.totalDevices} />
            <Kpi label={t("stats.online")} value={ov.onlineDevices} tone="var(--primary)" />
            <Kpi label={t("stats.offline")} value={ov.offlineDevices} />
            <Kpi label={t("stats.onlineRate")} value={`${(ov.onlineRate * 100).toFixed(1)}%`} />
            <Kpi label={t("stats.todayNew")} value={ov.todayNewDevices} />
            <Kpi label={t("stats.memberCount")} value={ov.memberCount} />
            <Kpi label={t("stats.inactive")} value={ov.inactiveDevices} />
            <Kpi label={t("stats.disabled")} value={ov.disabledDevices} tone="var(--destructive)" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("stats.dailyTrend")}</CardTitle>
              <div className="flex gap-1">
                {RANGES.map((r) => (
                  <Button key={r} size="sm" variant={days === r ? "default" : "outline"} onClick={() => setDays(r)}>
                    {t(r === 7 ? "stats.range7" : r === 30 ? "stats.range30" : "stats.range90")}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: "var(--primary)" }} />{t("stats.newDevices")}</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: "var(--muted-foreground)" }} />{t("stats.activeDevices")}</span>
              </div>
              {series.length === 0 ? (
                <div className="text-sm text-[var(--muted-foreground)]">{t("stats.noData")}</div>
              ) : (
                <div className="flex h-40 items-end gap-1 overflow-x-auto">
                  {series.map((p) => (
                    <div key={p.date} className="flex min-w-[10px] flex-1 flex-col items-center justify-end gap-0.5" title={`${p.date} · ${t("stats.newDevices")} ${p.newDevices} · ${t("stats.activeDevices")} ${p.activeDevices}`}>
                      <div className="flex w-full items-end justify-center gap-px" style={{ height: "100%" }}>
                        <span className="w-1/2 rounded-t" style={{ height: `${maxBar > 0 ? (p.newDevices / maxBar) * 100 : 0}%`, background: "var(--primary)" }} />
                        <span className="w-1/2 rounded-t" style={{ height: `${maxBar > 0 ? (p.activeDevices / maxBar) * 100 : 0}%`, background: "var(--muted-foreground)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-1 overflow-x-auto text-[10px] text-[var(--muted-foreground)]">
                {series.map((p) => (
                  <span key={p.date} className="min-w-[10px] flex-1 truncate text-center">{p.date.slice(5)}</span>
                ))}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">{t("stats.activeNote")}</div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{t("stats.deviceType")}</CardTitle></CardHeader>
              <CardContent>
                <Distribution title={t("stats.distribution")} items={ov.deviceTypeDistribution} label={(n) => deviceTypeLabel(t, n)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t("stats.brandTop")}</CardTitle></CardHeader>
              <CardContent><Distribution title={t("stats.distribution")} items={ov.brandTop} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t("stats.modelTop")}</CardTitle></CardHeader>
              <CardContent><Distribution title={t("stats.distribution")} items={ov.modelTop} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t("stats.osVersionTop")}</CardTitle></CardHeader>
              <CardContent><Distribution title={t("stats.distribution")} items={ov.osVersionTop} /></CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
