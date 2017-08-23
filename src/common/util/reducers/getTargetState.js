export default (state, target) =>
  target.split('.').reduce((result, segment) => {
    if (typeof result !== 'object') {
      return undefined;
    }
    return result[segment];
  }, state);
