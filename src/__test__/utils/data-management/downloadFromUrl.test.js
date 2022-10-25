import downloadFromUrl from 'utils/downloadFromUrl';

const mockDownloadUrl = 'https://www.example.com/download';

const linkSpy = jest.spyOn(document, 'createElement').mockImplementation(() => ({ style: {}, click: jest.fn() }));
const appendSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => jest.fn());

describe('downloadFromUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Downloads from url', () => {
    downloadFromUrl(mockDownloadUrl);

    // A new link is created with the correct attributes
    expect(linkSpy).toHaveBeenCalledWith('a');
    const linkEl = linkSpy.mock.results[0].value;
    expect(linkEl).toMatchSnapshot();

    // Link is appended
    expect(appendSpy).toHaveBeenCalledTimes(1);

    // Link has been clicked to trigger download
    expect(linkEl.click).toHaveBeenCalledTimes(1);
  });

  it('Uses filename if provided', () => {
    downloadFromUrl(mockDownloadUrl, 'mockFileName');

    // A new link is created with the correct attributes
    expect(linkSpy).toHaveBeenCalledWith('a');
    const linkEl = linkSpy.mock.results[0].value;
    expect(linkEl).toMatchSnapshot();

    // Link is appended
    expect(appendSpy).toHaveBeenCalledTimes(1);

    // Link has been clicked to trigger download
    expect(linkEl.click).toHaveBeenCalledTimes(1);
  });
});
