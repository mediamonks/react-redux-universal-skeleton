import { isFSA } from 'flux-standard-action';
import debugLib from 'debug';

const debug = debugLib('React:checkFSAMiddleware');

const checkFSA = () => next => action => {
  if (!isFSA(action)) {
    const stringifiedAction = JSON.stringify(action);
    debug(
      `Warning: an action was dispatched that does not follow the FSA format: \n${stringifiedAction}`,
    );
  }

  return next(action);
};

export default checkFSA;
