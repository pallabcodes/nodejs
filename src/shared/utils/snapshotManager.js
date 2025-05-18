const createSnapshotManager = () => {
  const history = [];
  let pointer = -1;

  return {
    snapshot: (ctx) => {
      history.splice(pointer + 1);
      history.push(JSON.parse(JSON.stringify(ctx)));
      pointer++;
    },
    undo: () => {
      if (pointer <= 0) return null;
      pointer--;
      return history[pointer];
    },
    redo: () => {
      if (pointer >= history.length - 1) return null;
      pointer++;
      return history[pointer];
    },
    current: () => (pointer >= 0 ? history[pointer] : null),
  };
};

module.exports = createSnapshotManager;
