# 🧩 Functional Middleware Architecture for Node.js

This repository provides a **fully modular, production-ready functional programming (FP) middleware runtime** for Node.js backends. It offers snapshotting, undo/redo, DSL-based composition, versioned context negotiation, effect isolation, and monoidal pipeline composition.

---

## 🚀 Project Highlights

* **Context-Aware Middleware**: All middleware operates over an immutable `ctx` object
* **Functional Primitives**: Result monads (`ok`, `err`) with metadata, side-effect separation
* **Composable Pipelines**: Monoids, DSL, priority execution, dynamic runtime reconfiguration
* **Undo & Replay**: Snapshot-based time-travel debugging, snapshotManager, fork + diff
* **Runtime Guarantees**: Semantic versioning, hot-swapping, typed validation
* **Observability-Ready**: Structured logger, metrics tags, correlationId injection

---

## 📁 Folder Structure

```
src/
├── config/              # Centralized configuration (roles, permissions)
├── middlewares/         # All atomic & advanced middlewares (auth, audit, retry, etc)
├── modules/             # Business domains (e.g. users)
├── pipelines/           # Pipeline composition logic (DSL, Monoid, etc)
├── utils/               # Functional primitives (compose, result, snapshotManager)
├── types/               # Type definitions for ctx, middleware signatures
├── tests/               # Unit tests for pipelines and middlewares
├── server.js            # Express bootloader
└── index.js             # Entrypoint
```

---

## 🧱 Key Concepts

### 🔗 Composable Middleware

Middleware is pure, composable, and predictable:

```js
const pipeline = compose(
  requestContext,
  auth,
  checkPermissions([PERMISSIONS.CREATE_USER])
);
```

### 📦 DSL-based Declarative Pipelines

```js
const pipeline = createPipeline()
  .use(requestContext)
  .use(auth)
  .if(ctx => ctx.user.roles.includes('admin'), (admin) => {
    admin.use(checkPermissions(['delete_user']));
  })
  .use(logging)
  .build();
```

### 🧠 Snapshot Manager (Debug/Replay)

```js
const snapshot = createSnapshotManager();
snapshot.snapshot(ctx);
const rolledBack = snapshot.undo();
```

---

## 🧪 Testing

```bash
npm install
node src/modules/users/tests.js
```

Uses basic assert-based tests. Add Jest or Vitest for full coverage.

---

## 🛠 Runtime Features

* **Hot Swapping**: Replace middleware at runtime via proxy
* **Effect-Based Architecture**: Log/audit effects returned, not executed inline
* **Fork + Reduce Pipelines**: Parallel branches with reducer merge
* **Schema Validation**: Yup/Zod schema support for `ctx` and `req.body`

---

## 🔧 Scripts

```bash
npm run dev     # start in development mode
npm run start   # production
npm run test    # run all tests
```

---

## 🐳 Docker + PM2 + Swagger

Coming next:

* Dockerfile + Compose
* PM2 ecosystem config
* Swagger auto-docs via `swagger-jsdoc`

---

## 👨‍💻 Maintainer Notes

This architecture is ideal for:

* Product teams with long-lived APIs
* Shared middleware libraries
* Tracing-heavy microservice stacks
* Functional JS shops (with fp-ts support planned)

---

## ✅ Future Ready

* 🎯 OpenAPI + Swagger
* ☁️ OPA/Casbin RBAC/ABAC
* 📈 OpenTelemetry/Jaeger
* ⚙️ Multitenancy / Feature Flags
* 🧾 GraphQL Support

---

## 📬 Contributions Welcome

Feel free to open issues or submit PRs. Fully modular design means every middleware can be tested and plugged independently.

---

## License

MIT © You
