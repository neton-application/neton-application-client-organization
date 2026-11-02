/** 模块 `organization`（C 端）的 zh-CN 词条。命名空间 = 模块 id，key 在 zh / en 之间必须完全一致。 */
const messages: Record<string, string> = {
  // 页面
  "eyebrow.org": "组织",
  "my.title": "我的组织",
  "my.description": "创建或加入组织，并在组织内维护成员（主/子账号）",
  "my.cardTitle": "我的组织",
  "my.empty": "还没有组织，点右上角创建或加入。",
  "common.loading": "加载中…",

  // 状态 / 角色
  "status.enabled": "正常",
  "status.disabled": "停用",
  "role.owner": "主账号",
  "role.admin": "管理员",
  "role.member": "成员",

  // 成员来源（OrgMemberSource）
  "source.1": "创建人",
  "source.2": "后台分配",
  "source.3": "邀请码加入",
  "source.4": "后台邀请",

  // 详情字段
  "detail.id": "编号：{id}",
  "detail.myRole": "我的角色：{role}",
  "detail.code": "编码：{code}",

  // 动作
  "action.join": "加入组织",
  "action.createOrg": "创建组织",
  "action.create": "创建",
  "action.joinConfirm": "加入",
  "action.add": "添加",
  "action.addMember": "添加成员",
  "action.cancel": "取消",
  "action.save": "保存",
  "action.editProfile": "编辑资料",
  "action.resetCode": "重置邀请码",
  "action.remove": "移除",

  // 成员区块 / 表头
  "section.members": "成员",
  "field.accountId": "账号 ID",
  "field.nickname": "昵称",
  "field.role": "角色",
  "field.source": "来源",
  "field.operations": "操作",
  "field.orgName": "组织名称",
  "field.inviteCode": "邀请码",
  "members.empty": "暂无成员",

  // 抽屉 / 弹层
  "drawer.createTitle": "创建组织",
  "drawer.createHint": "创建后你即为该组织的主账号（OWNER），可邀请 / 分配成员。",
  "drawer.joinTitle": "凭邀请码加入组织",
  "drawer.joinPlaceholder": "组织主账号提供的 10 位邀请码",
  "drawer.editTitle": "编辑组织资料",
  "drawer.addTitle": "添加成员",
  "drawer.addAccountIdPlaceholder": "要纳入组织的账号 ID",
  "confirm.removeTitle": "移除成员",
  "confirm.removeDescription": "将该账号从此组织移除（不影响其账号本身）。",

  // 提示 / 错误
  "toast.created": "组织已创建",
  "toast.joined": "已加入组织",
  "toast.updated": "资料已更新",
  "toast.codeReset": "邀请码已重置",
  "toast.memberAdded": "成员已添加",
  "toast.memberRemoved": "成员已移除",
  "member.invalidId": "请输入有效的账号 ID",
};

export default messages;
