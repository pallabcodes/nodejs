const withMeta = (fn, meta) => {
    fn.meta = meta;
    return fn;
};