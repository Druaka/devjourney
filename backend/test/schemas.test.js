const { PtcgSetModel, TcgpSetModel } = require('../src/models/schemas');

describe('schemas model exports', () => {
  it('exports PtcgSetModel and TcgpSetModel with correct modelName', () => {
    expect(PtcgSetModel).toBeDefined();
    expect(TcgpSetModel).toBeDefined();
    expect(PtcgSetModel.modelName).toBe('PtcgSet');
    expect(TcgpSetModel.modelName).toBe('TcgpSet');
  });
});
