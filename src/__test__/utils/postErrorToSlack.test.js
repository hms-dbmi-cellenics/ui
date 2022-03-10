import postErrorToSlack from 'utils/postErrorToSlack';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

enableFetchMocks();

const mockError = { stack: 'Mock error stack' };
const mockInfo = { componentStack: 'Mock component stack' };

jest.useFakeTimers('modern').setSystemTime(new Date('2020-01-01').getTime());
window.location.href = jest.fn('http://localhost:3000/experiments/testae48e318dab9a1bd0bexperiment/data-exploration');

jest.mock('@aws-amplify/auth', () => ({
  currentAuthenticatedUser: () => Promise.resolve({
    attributes: {
      name: 'John Doe',
      email: 'fake@email.com',
    },
    username: '5152fake-eb52-474c-user-mocke8c8user',
  }),
}));

describe('PostErrorToSlack', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
  });

  it('Posts requests correctly', async () => {
    await postErrorToSlack(mockError, mockInfo);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]).toMatchSnapshot();

    const { body: formData } = fetchMock.mock.calls[0][1];

    // Check content of body
    formData.forEach((value, key) => {
      // Skip if key === token because it contains a token
      if (key === 'token') return;

      expect(value).toMatchSnapshot();
    });
  });

  it('Should not throw an error if POSTing fails', async () => {
    fetchMock.mockIf(/.*/, () => Promise.reject(new Error('Some random error')));

    expect(async () => {
      await postErrorToSlack(mockError, mockInfo);
    }).not.toThrow();
  });
});
