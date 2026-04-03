// Silence console methods during tests to reduce noise.
// This file is loaded via Jest `setupFiles` before modules are required,
// so avoid using Jest globals here and directly override console methods.
const _origConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

console.log = () => {};
console.info = () => {};
console.warn = () => {};
console.error = () => {};
console.debug = () => {};

process.on('exit', () => {
  console.log = _origConsole.log;
  console.info = _origConsole.info;
  console.warn = _origConsole.warn;
  console.error = _origConsole.error;
  console.debug = _origConsole.debug;
});
