// eslint-disable-next-line camelcase
import { JSON_parse } from 'uint8array-json-parser';

import parseResult from 'utils/work/parseResult';

jest.mock('uint8array-json-parser', () => ({
  __esModule: true, // this property makes it work
  JSON_parse: jest.fn(),
}));

describe('unpackResult with json result', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('default parsing is json', async () => {
    const storageArrayBuffer = new ArrayBuffer(10);
    const parsedResult = { a: 10 };

    JSON_parse.mockReturnValueOnce(parsedResult);

    const result = parseResult(storageArrayBuffer, 'RandomWorkRequest');
    expect(result).toEqual(parsedResult);

    expect(JSON_parse).toHaveBeenCalledWith(storageArrayBuffer);
  });

  it('GetNormalizedExpression parser is identity (leave it like that)', async () => {
    const storageArrayBuffer = new ArrayBuffer(10);

    expect(JSON_parse).not.toHaveBeenCalled();

    const result = parseResult(storageArrayBuffer, 'GetNormalizedExpression');
    expect(result).toEqual(storageArrayBuffer);
  });
});
