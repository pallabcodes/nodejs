// where can I use it > and how to Build a tiny DSL (domain-specific language) for permissions, using database or JSON as mentioned below
// This improves readability and can be extended to dynamically generate policies from JSON or database.

const canCreateOrUpdateUser = or(
    checkPermissions(['create_user']),
    checkPermissions(['update_user'])
);