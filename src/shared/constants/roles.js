export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  SUPERVISOR: 'supervisor',
  MANAGER: 'manager',
  USER: 'user'
};

export const ROLE_PERMISSIONS = {
  admin: ['*'],
  moderator: ['manage_users', 'view_reports'],
  supervisor: ['view_reports'],
  manager: ['manage_team'],
  user: ['view_self']
};