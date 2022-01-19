import { v4 as uuidv4 } from 'uuid';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import SocketMock from 'socket.io-mock';
import { seekFromAPI } from 'utils/work/seekWorkResponse';
import fake from '__test__/test-utils/constants';
import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';

import unpackResult from 'utils/work/unpackResult';

/**
 * jest.mock calls are automatically hoisted to the top of the javascript
 * during compilation. Accordingly, `mockEmit` and `mockOn` as exported
 * from jest.mock will be accessible under `socketConnectionMocks`, even
 * if they do not appear in the original file.
 */
import * as socketConnectionMocks from 'utils/socketConnection';

enableFetchMocks();
uuidv4.mockImplementation(() => 'my-random-uuid');

jest.mock('uuid');

jest.mock('moment', () => () => jest.requireActual('moment')('4022-01-01T00:00:00.000Z'));

jest.mock('utils/socketConnection', () => {
  const mockEmit = jest.fn();
  const mockOn = jest.fn();

  return {
    __esModule: true,
    default: new Promise((resolve) => {
      resolve({ emit: mockEmit, on: mockOn, id: '5678' });
    }),
    mockEmit,
    mockOn,
  };
});

jest.mock('@aws-amplify/storage', () => ({
  get: jest.fn().mockImplementation(async () => 'http://clearly-invalid-url'),
}));

jest.mock('@aws-amplify/core', () => ({
  configure: jest.fn().mockImplementation(() => ({
    Storage: {
      AWSS3: {
        bucket: 'biomage-originals-test',
      },
    },
  })),
}));

jest.mock('@aws-amplify/auth', () => ({}));

jest.mock('utils/work/unpackResult');

describe('seekFromAPI unit tests', () => {
  const experimentId = '1234';
  const timeout = 30;
  const body = {
    name: 'ImportantTask',
    type: 'fake task',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(fake.EXPERIMENT_ID)));

    unpackResult.mockResolvedValueOnce({ hello: 'world' });

    const socketMock = new SocketMock();

    socketConnectionMocks.mockEmit.mockImplementation((workRequestType, requestBody) => {
      const responseBody = {
        response: {
          error: false,
        },
      };

      // This is a mocked response emit response from server
      socketMock.socketClient.emit(`WorkResponse-${requestBody.ETag}`, responseBody);
    });

    socketConnectionMocks.mockOn.mockImplementation((channel, socketCallback) => {
      // This is a listener for the response from the server
      socketMock.on(channel, (responseBody) => {
        socketCallback(responseBody);
      });
    });
  });

  it('Sends work to the backend when called and returns valid response.', async () => {
    fetchMock.mockResponse(JSON.stringify({ signedUrl: 'http://www.apiUrl:portNum/path/blabla' }));

    const response = await seekFromAPI(
      experimentId, body, timeout, 'facefeed',
    );
    expect(socketConnectionMocks.mockEmit).toHaveBeenCalledWith('WorkRequest', {
      ETag: 'facefeed',
      socketId: '5678',
      experimentId: '1234',
      timeout: '4022-01-01T00:00:30.000Z',
      body: { name: 'ImportantTask', type: 'fake task' },
    });

    expect(socketConnectionMocks.mockOn).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ hello: 'world' });
  });

  it('Returns an error if there is error in the response.', async (done) => {
    const flushPromises = () => new Promise(setImmediate);

    socketConnectionMocks.mockOn.mockImplementation(async (x, f) => {
      f({
        response: { error: 'The backend returned an error' },
      });
    });

    expect(seekFromAPI(experimentId, body, timeout, 'facefeed')).rejects.toEqual(new Error('The backend returned an error'));
    await flushPromises();

    expect(socketConnectionMocks.mockEmit).toHaveBeenCalledWith('WorkRequest', {
      ETag: 'facefeed',
      socketId: '5678',
      experimentId: '1234',
      timeout: '4022-01-01T00:00:30.000Z',
      body: { name: 'ImportantTask', type: 'fake task' },
    });

    done();
  });
});
