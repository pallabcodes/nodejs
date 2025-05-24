import { ok } from '../shared/utils/result.js';
import { freeze } from 'immer';

export const immutableContext = async (ctx) => {
  freeze(ctx, true); // Deep freeze
  return ok(ctx);
};