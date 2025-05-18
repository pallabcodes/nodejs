const ROLES = {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    EDITOR: 'editor',
    USER: 'user'
};

const PERMISSIONS = {
    CREATE_USER: 'create_user',
    UPDATE_USER: 'update_user',
    DELETE_USER: 'delete_user',
    VIEW_USER: 'view_user',
    EDIT_CONTENT: 'edit_content',
    VIEW_REPORTS: 'view_reports',
    // add as needed
};

// Map roles to permissions (can be loaded from DB or config service)
const ROLE_PERMISSIONS = {
    superadmin: ['*'], // wildcard all permissions
    admin: [PERMISSIONS.CREATE_USER, PERMISSIONS.UPDATE_USER, PERMISSIONS.DELETE_USER, PERMISSIONS.VIEW_USER, PERMISSIONS.VIEW_REPORTS],
    manager: [PERMISSIONS.VIEW_USER, PERMISSIONS.VIEW_REPORTS],
    editor: [PERMISSIONS.EDIT_CONTENT],
    user: [PERMISSIONS.VIEW_USER]
};

export { ROLES, PERMISSIONS, ROLE_PERMISSIONS };