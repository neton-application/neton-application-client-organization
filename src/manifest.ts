import { defineFrontModule } from "@neton/application-client-contract";

/**
 * 组织·用户面（C 端 client 控制台，对标后端 neton-application-module-organization）。
 * 组织由管理后台开通（SPEC organization-integration §7.1）；登录后侧栏「组织」分组按**真实组织名**
 * 动态列出每个组织（见 console shell 的 workspace-root），每个组织下挂三页：
 *  - `/organization/my`：我的组织目录（列出我所属的全部组织 + 角色 + 状态，进入各组织子页）；
 *  - `/organization/:orgId/stats`：数据统计中心（仅组织管理员，后端 requireRole(ADMIN) 网关）；
 *  - `/organization/:orgId/members`：组织成员（独立页，仅管理员管理；列表含「登录账号」列）；
 *  - `/organization/:orgId/profile`：组织资料（成员可见，管理员可改名）。
 * 子账号只能「新建」（username 由后端按组织标识自动生成），纳管已有账号入口已下线。
 */
export default defineFrontModule({
  id: "organization",
  contractVersion: "1.0.0",
  locales: [
    { lang: "zh-CN", entry: "zh-CN" },
    { lang: "en-US", entry: "en-US" },
  ],
  pages: [
    { key: "organization/my/index", path: "/organization/my", entry: "my-orgs", rendering: "client", title: "我的组织" },
    { key: "organization/stats/index", path: "/organization/:orgId/stats", entry: "org-stats", rendering: "client", title: "数据统计" },
    { key: "organization/members/index", path: "/organization/:orgId/members", entry: "org-members", rendering: "client", title: "组织成员" },
    { key: "organization/profile/index", path: "/organization/:orgId/profile", entry: "org-profile", rendering: "client", title: "组织资料" },
  ],
});
