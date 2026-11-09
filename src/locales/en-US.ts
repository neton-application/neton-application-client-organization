/** Module `organization` (client) en-US catalog. Keys must exactly match zh-CN. */
const messages: Record<string, string> = {
  // Page
  "eyebrow.org": "ORGANIZATION",
  "my.title": "My organization",
  "my.description": "Organizations are provisioned by the backoffice. View the ones you belong to; owners/admins manage members, members see only themselves.",
  "my.cardTitle": "My organizations",
  "my.empty": "You are not in any organization yet — ask the backoffice to provision one.",
  "common.loading": "Loading…",

  // Status / role
  "status.enabled": "Active",
  "status.disabled": "Disabled",
  "role.owner": "Owner",
  "role.admin": "Admin",
  "role.member": "Member",

  // Member source (OrgMemberSource)
  "source.1": "Creator",
  "source.2": "Assigned by backoffice",
  "source.3": "Joined via invite code",
  "source.4": "Invited by backoffice",

  // Detail fields
  "detail.id": "ID: {id}",
  "detail.myRole": "My role: {role}",
  "detail.code": "Organization code: {code}",

  // Actions
  "action.create": "Create",
  "action.add": "Add",
  "action.addMember": "Add member",
  "action.cancel": "Cancel",
  "action.save": "Save",
  "action.editProfile": "Edit profile",
  "action.remove": "Remove",

  // Members section / table headers
  "section.members": "Members",
  "field.accountId": "Account ID",
  "field.nickname": "Nickname",
  "field.role": "Role",
  "field.source": "Source",
  "field.operations": "Actions",
  "field.orgName": "Organization name",
  "field.password": "Password",
  "members.empty": "No members yet",

  // Member add mode
  "member.mode": "Add method",
  "member.modeCreate": "Create sub-account",
  "member.modeExisting": "Manage existing account",

  // Drawers / dialogs
  "drawer.editTitle": "Edit organization profile",
  "drawer.addTitle": "Add member",
  "drawer.addAccountIdPlaceholder": "Account ID to add to the organization",
  "drawer.passwordPlaceholder": "At least 8 characters",
  "drawer.createMemberHint": "The username is generated automatically from the organization code (e.g. code shang → shang1, shang2). You only set a nickname and initial password; the member logs in to the console with that username + password and can only see their own info and this organization's devices.",
  "confirm.removeTitle": "Remove member",
  "confirm.removeDescription": "This removes the account from the organization (its account itself is unaffected).",

  // Toasts / errors
  "toast.updated": "Profile updated",
  "toast.memberCreated": "Sub-account created and added to the organization",
  "toast.memberCreatedWithUsername": "Sub-account created: username {username} (share it with the member to log in to the console with this username + password)",
  "toast.memberAdded": "Member added",
  "toast.memberRemoved": "Member removed",
  "member.invalidId": "Please enter a valid account ID",
  "member.passwordShort": "Password must be at least 8 characters",
};

export default messages;
