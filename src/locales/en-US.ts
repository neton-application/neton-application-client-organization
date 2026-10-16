/** Module `organization` (client) en-US catalog. Keys must exactly match zh-CN. */
const messages: Record<string, string> = {
  // Page
  "my.title": "My organization",
  "my.description": "Create or join an organization and manage its members (owner / sub-accounts).",
  "my.cardTitle": "My organizations",
  "my.empty": "No organizations yet — create or join one from the top right.",
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
  "detail.code": "Code: {code}",

  // Actions
  "action.join": "Join organization",
  "action.createOrg": "Create organization",
  "action.create": "Create",
  "action.joinConfirm": "Join",
  "action.add": "Add",
  "action.addMember": "Add member",
  "action.cancel": "Cancel",
  "action.save": "Save",
  "action.editProfile": "Edit profile",
  "action.resetCode": "Reset invite code",
  "action.remove": "Remove",

  // Members section / table headers
  "section.members": "Members",
  "field.accountId": "Account ID",
  "field.nickname": "Nickname",
  "field.role": "Role",
  "field.source": "Source",
  "field.operations": "Actions",
  "field.orgName": "Organization name",
  "field.inviteCode": "Invite code",
  "members.empty": "No members yet",

  // Drawers / dialogs
  "drawer.createTitle": "Create organization",
  "drawer.createHint": "Once created, you become the organization owner and can invite / assign members.",
  "drawer.joinTitle": "Join with an invite code",
  "drawer.joinPlaceholder": "10-digit invite code provided by the organization owner",
  "drawer.editTitle": "Edit organization profile",
  "drawer.addTitle": "Add member",
  "drawer.addAccountIdPlaceholder": "Account ID to add to the organization",
  "confirm.removeTitle": "Remove member",
  "confirm.removeDescription": "This removes the account from the organization (its account itself is unaffected).",

  // Toasts / errors
  "toast.created": "Organization created",
  "toast.joined": "Joined the organization",
  "toast.updated": "Profile updated",
  "toast.codeReset": "Invite code reset",
  "toast.memberAdded": "Member added",
  "toast.memberRemoved": "Member removed",
  "member.invalidId": "Please enter a valid account ID",
};

export default messages;
