import { defineFrontModule } from "@neton/application-client-contract";

/**
 * 组织·用户面（C 端 client 控制台，对标后端 neton-application-module-organization）。
 * 组织由管理后台开通（SPEC organization-integration §7.1）；登录后在这里查看所属组织，
 * 负责人/管理员给本组织建子账号或纳管已有账号，成员只看自己（不管理成员列表）。
 * 单页自包含：左侧我的组织，右侧选中组织的资料 + 成员管理，全靠本地状态切换，不依赖路由参数。
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
  ],
});
