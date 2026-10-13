import { defineFrontModule } from "@neton/application-client-contract";

/**
 * 组织·用户面（C 端 client 控制台，对标后端 neton-application-module-organization）。
 * 登录后像钉钉一样创建 / 凭邀请码加入组织，并在选中的组织里维护成员（主/子账号）。
 * 单页自包含：左侧我的组织，右侧选中组织的资料 + 成员管理，全靠本地状态切换，不依赖路由参数。
 */
export default defineFrontModule({
  id: "organization",
  contractVersion: "1.0.0",
  pages: [
    { key: "organization/my/index", path: "/organization/my", entry: "my-orgs", rendering: "client", title: "我的组织" },
  ],
});
