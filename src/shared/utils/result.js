const ok = (ctx) => ({ ok: true, ctx });

const err = (error, code = 'GENERIC', remediation = null) => ({
    ok: false,
    error: {
        message: error.message || error.toString(),
        code,
        remediation,
        stack: error.stack || new Error().stack,
    },
});

const isOk = (res) => res.ok === true;
const isErr = (res) => res.ok === false;

export { ok, err, isOk, isErr };
