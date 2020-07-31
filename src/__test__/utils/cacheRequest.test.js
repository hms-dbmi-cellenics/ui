import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { cacheFetch, objectToSortedString } from '../../utils/cacheRequest';

enableFetchMocks();
const mockGet = jest.fn();
const mockSet = jest.fn();

jest.mock('../../utils/cache', () => ({
  get: jest.fn((x) => { console.log('I am a mocked get: ', x); mockGet(); return 'blabla'; }),
  _set: jest.fn((x) => { console.log('I am a mocked set: ', x); mockSet(); }),
}));


describe('fetch things', () => {
  beforeEach(() => {
    const response = new Response(JSON.stringify({}));
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('fetches results from cache when the request is GET', async () => {
    const res = await cacheFetch('https://test.com', { method: 'GET' });
    expect(res).toEqual('blabla');
    expect(mockGet).toBeCalledTimes(1);
    expect(mockSet).toBeCalledTimes(0);
  });
  it('does not fetch results from cache when the request is PUT', async () => {
    await cacheFetch('https://test.com', { method: 'PUT' });
    expect(mockSet).toBeCalledTimes(0);
    expect(mockGet).toBeCalledTimes(0);
  });
  it('retrives data from cache if no options are provided', async () => {
    await cacheFetch('https://test.com');
    expect(mockSet).toBeCalledTimes(0);
    expect(mockGet).toBeCalledTimes(1);
  });
  it('the object the hash will be computed on is sorted', () => {
    const options = {
      hi: 'I',
      am: 'a',
      test: 'this',
      is: 'my',
      body: '{"hello":"world"}',
    };
    const sortedOptions = objectToSortedString(options);
    expect(sortedOptions).toEqual('amabody{"hello":"world"}hiIismytestthis');
  });
});
