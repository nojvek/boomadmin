/* eslint-env node */

// TODO: this is in works to make a proper jss.ts loader that outputs to .css

const {spawnSync} = require(`child_process`);
const {getOptions} = require(`loader-utils`);

module.exports = function() {
  // we're delivering the result in pitch phase, so we don't return anything here
  // see: https://webpack.js.org/api/loaders/#pitching-loader
  return ``;
};

module.exports.pitch = function(requestPath) {
  this.cacheable(false); // not cacheable
  const callback = this.async(true);

  const rootContext = this.rootContext;
  const options = getOptions(this);
  const {nodeArgs = []} = options;

  // console.log(`node`, [...nodeArgs, requestPath]);
  // TODO: make this async
  const evalResult = spawnSync(`node`, [...nodeArgs, requestPath], {cwd: rootContext});
  if (evalResult.status === 0) {
    const outputStr = evalResult.stdout.toString();
    callback(null, outputStr);
  } else {
    const errorStr = evalResult.stderr.toString();
    callback(new Error(errorStr));
  }
};
