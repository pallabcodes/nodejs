export const analyticsBranch = async (ctx) => {
  const { req } = ctx;
  if (req.query.analytics === 'true') {
    // Do something special for analytics
    return { branch: 'analytics' }; // This will stop the pipeline and record the branch
  }
  return { value: {} };
};