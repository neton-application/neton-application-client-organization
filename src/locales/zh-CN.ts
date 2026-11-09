/** 模块 `organization`（C 端）的 zh-CN 词条。命名空间 = 模块 id，key 在 zh / en 之间必须完全一致。 */
const messages: Record<string, string> = {
  // 页面
  "eyebrow.org": "组织",
  "my.title": "我的组织",
  "my.description": "组织由管理后台开通；在这里查看所属组织，负责人/管理员维护成员，成员只看自己。",
  "my.cardTitle": "我的组织",
  "my.empty": "你还没有加入任何组织，请联系管理后台开通。",
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
  "detail.code": "组织标识：{code}",

  // 动作
  "action.create": "创建",
  "action.add": "添加",
  "action.addMember": "添加成员",
  "action.cancel": "取消",
  "action.save": "保存",
  "action.editProfile": "编辑资料",
  "action.remove": "移除",

  // 成员区块 / 表头
  "section.members": "成员",
  "field.accountId": "账号 ID",
  "field.nickname": "昵称",
  "field.role": "角色",
  "field.source": "来源",
  "field.operations": "操作",
  "field.orgName": "组织名称",
  "field.password": "登录密码",
  "members.empty": "暂无成员",

  // 成员添加模式
  "member.mode": "添加方式",
  "member.modeCreate": "新建子账号",
  "member.modeExisting": "纳管已有账号",

  // 抽屉 / 弹层
  "drawer.editTitle": "编辑组织资料",
  "drawer.addTitle": "添加成员",
  "drawer.addAccountIdPlaceholder": "要纳入组织的账号 ID",
  "drawer.passwordPlaceholder": "至少 8 位",
  "drawer.createMemberHint": "登录账号由系统按组织标识自动生成（如标识 shang → shang1、shang2）；你只需设置昵称和初始密码，成员用该账号+密码登录 console，只能看到自己的信息和本组织的设备。",
  "confirm.removeTitle": "移除成员",
  "confirm.removeDescription": "将该账号从此组织移除（不影响其账号本身）。",

  // 提示 / 错误
  "toast.updated": "资料已更新",
  "toast.memberCreated": "子账号已创建并加入组织",
  "toast.memberCreatedWithUsername": "子账号已创建：登录账号 {username}（请告知成员，用此账号+密码登录 console）",
  "toast.memberAdded": "成员已添加",
  "toast.memberRemoved": "成员已移除",
  "member.invalidId": "请输入有效的账号 ID",
  "member.passwordShort": "密码至少 8 位",
};

export default messages;
