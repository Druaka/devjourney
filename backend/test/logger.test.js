describe('logger module', () => {
  let logger;

  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    logger = require('../logger');
  });

  it('calls console.log with prefixed args', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    logger.log('a', 'b');
    expect(spy).toHaveBeenCalledWith('[devjourney-backend]', 'a', 'b');
  });

  it('calls console.info/warn/error/debug with prefix', () => {
    const sinfo = jest.spyOn(console, 'info').mockImplementation(() => {});
    const swarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const serror = jest.spyOn(console, 'error').mockImplementation(() => {});
    const sdebug = jest.spyOn(console, 'debug').mockImplementation(() => {});

    logger.info('i');
    logger.warn('w');
    logger.error('e');
    logger.debug('d');

    expect(sinfo).toHaveBeenCalledWith('[devjourney-backend]', 'i');
    expect(swarn).toHaveBeenCalledWith('[devjourney-backend]', 'w');
    expect(serror).toHaveBeenCalledWith('[devjourney-backend]', 'e');
    expect(sdebug).toHaveBeenCalledWith('[devjourney-backend]', 'd');
  });
});
