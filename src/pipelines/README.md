# Pipeline Implementations

This directory contains different pipeline implementations, each optimized for specific use cases. Choose the one that best fits your needs:

## 🎯 Simple Pipeline (`simplePipeline.js`)
```js
const pipeline = createSimplePipeline()
  .auth()
  .validate(schema)
  .cache()
  .requirePermissions(['CREATE_USER'])
  .build();
```
- ✅ Simple, chainable API
- ✅ Common middleware patterns
- ✅ Great for basic CRUD routes
- ❌ No advanced features

## 🎨 DSL Pipeline (`dslPipeline.js`)
```js
const pipeline = createPipeline()
  .use(requestContext)
  .if(ctx => ctx.user.roles.includes('admin'), 
    pipeline => pipeline.use(adminOnly))
  .build();
```
- ✅ Declarative routing logic
- ✅ Conditional branches
- ✅ Error handling
- ✅ Perfect for complex routing

## 🧮 Monoid Pipeline (`monoidPipeline.js`)
```js
const pipeline = composePipelines(
  basePipeline,
  customMiddleware
);
```
- ✅ Pure functional composition
- ✅ Algebraic properties
- ✅ Easy to extend
- ✅ Ideal for FP enthusiasts

## 📸 Snapshot Pipeline (`snapshotWrappedPipeline.js`)
```js
const pipeline = createSnapshotWrappedPipeline(innerPipeline);
```
- ✅ Undo/redo support
- ✅ Time-travel debugging
- ✅ Transaction-like semantics
- ✅ Great for complex state management

## 🔒 Role-Based Pipelines
- `adminPipeline.js`: Admin-specific flows
- `userPipeline.js`: User-centric operations

## 💡 Which One Should I Use?

1. **Starting Simple?** → Use `simplePipeline.js`
2. **Complex Routing?** → Use `dslPipeline.js`
3. **Love FP?** → Use `monoidPipeline.js`
4. **Need Undo/Redo?** → Use `snapshotWrappedPipeline.js`
5. **Role-Specific Logic?** → Use role-based pipelines

Remember: You can mix and match! The pipelines are composable and can work together.
