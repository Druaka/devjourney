const prefix = '[devjourney-backend]';

function formatArgs(args) {
  return [prefix, ...args];
}

module.exports = {
  log: (...args) => console.log(...formatArgs(args)),
  info: (...args) => console.info(...formatArgs(args)),
  warn: (...args) => console.warn(...formatArgs(args)),
  error: (...args) => console.error(...formatArgs(args)),
  debug: (...args) => console.debug(...formatArgs(args)),
};
