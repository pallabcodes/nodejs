export const cacheCheck = async (ctx) => {
  const { req, res } = ctx;
  const cached = await someCache.get(req.params.userId);
  if (cached) {
    res.json({ fromCache: true, data: cached });
    return { skip: true }; // This will stop the pipeline
  }
  return { value: {} };
};