class AuthError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'AuthError';
        this.status = 401;
    }
}

class PermissionError extends Error {
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'PermissionError';
        this.status = 403;
    }
}