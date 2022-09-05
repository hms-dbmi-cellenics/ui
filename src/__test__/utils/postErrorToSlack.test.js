import postErrorToSlack from 'utils/postErrorToSlack';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

enableFetchMocks();

const mockError = { message: 'mockMessage', stack: 'Mock error stack' };
const mockReduxDump = {
  cellInfo: {
    focus: {
      store: 'cellSets',
      key: 'louvain',
    },
    groupedTrack: 'louvain',
    selectedTracks: [
      'louvain',
    ],
  },
  cellSets: {
    properies: {
      'louvain-0': {
        cellIds: new Set(Array(25).fill(0)),
      },
    },
  },
  cellMeta: {
    mitochondrialContent: {
      loading: true,
      error: false,
      data: new Array(25).fill(0),
    },
  },
  networkResources: {
    environment: 'test',
  },
};

jest.useFakeTimers('modern').setSystemTime(new Date('2020-01-01').getTime());

delete window.location;
window.location = {
  href: 'http://localhost:3000/experiments/testae48e318dab9a1bd0bexperiment/data-exploration',
};

jest.mock('@aws-amplify/auth', () => ({
  currentAuthenticatedUser: () => Promise.resolve({
    attributes: {
      name: 'John Doe',
      email: 'fake@email.com',
    },
    username: '5152fake-eb52-474c-user-mocke8c8user',
  }),
}));

jest.mock('stacktrace-js', () => ({
  fromError: () => Promise.resolve(['line1', 'line2']),
}));

describe('PostErrorToSlack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.resetMocks();
  });

  it('Posts requests correctly', async () => {
    await postErrorToSlack(mockError, mockReduxDump);

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
    fetchMock.mockIf(/.*/, () => Promise.resolve(new Response('Server error', { status: 500 })));

    await postErrorToSlack(mockError, mockReduxDump);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
