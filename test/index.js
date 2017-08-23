// require all test files
const testsContext = require.context('./', true, /spec\.js/);

testsContext.keys().forEach(testsContext);

const sourcesContext = require.context('../src/common', true, /\.(ts|js|jsx)$/);

sourcesContext.keys().forEach(sourcesContext);
