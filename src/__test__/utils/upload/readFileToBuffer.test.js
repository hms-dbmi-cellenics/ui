import readFileToBuffer from 'utils/upload/readFileToBuffer';

const mockContent = 'mock_file';

const states = {
  ABORT: 'ABORT',
  ERROR: 'ERROR',
};

const mockFileReader = (state) => {
  Object.defineProperty(global, 'FileReader', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      state,
      result: null,
      readAsArrayBuffer(content) {
        if (this.state === states.ABORT) this.onabort();
        if (this.state === states.ERROR) this.onerror();
        this.result = content;
        this.onload();
      },
    })),
  });
};

describe('readFileToBuffer', () => {
  it('Works properly if there are no errors', async () => {
    mockFileReader();
    const result = await readFileToBuffer(mockContent);

    expect(result.toString()).toEqual(mockContent);
  });

  it('Throws an error if aborted', async () => {
    mockFileReader(states.ABORT);

    await expect(readFileToBuffer(mockContent)).rejects.toThrow('aborted');
  });

  it('Throws an error if there is an error while reading file ', async () => {
    mockFileReader(states.ERROR);

    await expect(readFileToBuffer(mockContent)).rejects.toThrow('error');
  });
});
