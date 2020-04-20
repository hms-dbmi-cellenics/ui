const lessToJs = require('less-vars-to-js');

module.exports = (content) => (
  `module.exports = ${JSON.stringify(lessToJs(content, { resolveVariables: true }))}`
);
