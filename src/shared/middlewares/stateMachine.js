// src/middlewares/stateMachine.js
const { ok, err } = require('../utils/result');

const states = {
  START: 'start',
  AUTHENTICATED: 'authenticated',
  VALIDATED: 'validated',
  FINISHED: 'finished'
};

const stateMachineMiddleware = async (ctx) => {
  switch (ctx.state) {
    case states.START:
      return ok({ ...ctx, state: states.AUTHENTICATED });
    case states.AUTHENTICATED:
      return ok({ ...ctx, state: states.VALIDATED });
    case states.VALIDATED:
      return ok({ ...ctx, state: states.FINISHED });
    default:
      return err(new Error(`Invalid state: ${ctx.state}`), 'STATE_MACHINE_INVALID');
  }
};

module.exports = { states, stateMachineMiddleware };
