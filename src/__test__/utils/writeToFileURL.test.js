import writeToFileURL from 'utils/upload/writeToFileURL';

const mockCreateObjectURL = jest.fn(() => 'mockURL');

// mock window.URL.createObjectURL as it is not available in JSDOM
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
  },
});

describe('writeToFile test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should return a value', () => {
    const text = 'test';
    const url = writeToFileURL(text);

    expect(url).toBeDefined();
  });

  it('Should write the correct data', () => {
    const text = 'test';

    writeToFileURL(text);

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockCreateObjectURL).toHaveBeenCalledWith(new Blob([text]));
  });
});
