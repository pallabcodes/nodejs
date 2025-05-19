// Result type for functional error handling
export const ok = (value) => ({
  isOk: true,
  isErr: false,
  value,
  error: null
});

export const err = (error) => ({
  isOk: false,
  isErr: true,
  value: null,
  error
});

export const isOk = (result) => result.isOk;
export const isErr = (result) => result.isErr;

export const unwrap = (result) => {
  if (isErr(result)) {
    throw result.error;
  }
  return result.value;
};

export const unwrapOr = (result, defaultValue) => {
  if (isErr(result)) {
    return defaultValue;
  }
  return result.value;
};
