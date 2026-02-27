import parseResult from 'utils/work/parseResult';

jest.mock('utils/work/fzstdDecompress', () => ({
  isZstdCompressed: jest.fn(() => false),
  zstdDecompress: jest.fn(),
}));

describe('unpackResult with json result', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('default parsing is json from string', async () => {
    const testData = { a: 10 };
    const jsonString = JSON.stringify(testData);

    const result = await parseResult(jsonString, 'RandomWorkRequest');
    expect(result).toEqual(testData);
  });

  it('GetNormalizedExpression parser is identity (leave it like that)', async () => {
    const storageArrayBuffer = new ArrayBuffer(10);

    const result = await parseResult(storageArrayBuffer, 'GetNormalizedExpression');
    expect(result).toEqual(storageArrayBuffer);
  });
});
