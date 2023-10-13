import { v4 as uuidv4 } from 'uuid';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import SocketMock from 'socket.io-mock';
import { dispatchWorkRequest, seekFromS3 } from 'utils/work/seekWorkResponse';
import fake from '__test__/test-utils/constants';
import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';

import unpackResult from 'utils/work/unpackResult';
import parseResult from 'utils/work/parseResult';

/**
 * jest.mock calls are automatically hoisted to the top of the javascript
 * during compilation. Accordingly, `mockEmit` and `mockOn` as exported
 * from jest.mock will be accessible under `socketConnectionMocks`, even
 * if they do not appear in the original file.
 */
import * as socketConnectionMocks from 'utils/socketConnection';
import { waitFor } from '@testing-library/react';

enableFetchMocks();
uuidv4.mockImplementation(() => 'my-random-uuid');

jest.mock('uuid');
jest.mock('dayjs', () => () => jest.requireActual('dayjs')('4022-01-01T00:00:00.000Z'));
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

jest.mock('utils/work/parseResult');

const mockResponseDataCompressed = 'mockResCompressed';
const mockResponseDataDecompressed = 'mockResDecompressed';

jest.mock('utils/work/unpackResult', () => ({
  __esModule: true,
  default: jest.fn(),
  decompressUint8Array: jest.fn().mockImplementation(() => mockResponseDataDecompressed),
}));

const taskName = 'GetEmbedding';

describe('dispatchWorkRequest unit tests', () => {
  const experimentId = fake.EXPERIMENT_ID;
  const timeout = 30;
  const body = {
    name: taskName,
    type: 'fake task',
  };

  const dispatchMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(fake.EXPERIMENT_ID)));

    const socketMock = new SocketMock();

    parseResult.mockImplementationOnce(() => 'mockParsedResult');

    socketConnectionMocks.mockEmit.mockImplementation((workRequestType, requestBody) => {
      const podInfo = {
        response: {
          podInfo: {
            name: 'worker-pod',
            creationTimestamp: '2022-04-29T07:48:47.000Z',
            phase: 'Pending',
          },
        },
      };

      // mockDecompressUint8Array.mockReturnValue(Promise.resolve(mockResponseDataDecompressed));

      // This is a mocked response emit response from server
      socketMock.socketClient.emit(`WorkResponse-${requestBody.ETag}`, mockResponseDataCompressed);
      socketMock.socketClient.emit(`WorkerInfo-${fake.EXPERIMENT_ID}`, podInfo);
    });

    socketConnectionMocks.mockOn.mockImplementation((channel, socketCallback) => {
      // This is a listener for the response from the server
      socketMock.on(channel, (responseBody) => {
        socketCallback(responseBody);
      });
    });
  });

  it('Sends work to the worker when called', async () => {
    fetchMock.mockResponse(JSON.stringify({ signedUrl: 'http://www.apiUrl:portNum/path/blabla' }));

    const resultPromise = dispatchWorkRequest(
      experimentId, body, timeout, 'facefeed', null, dispatchMock,
    );

    // Wait for subscription to WorkResponse-facefeed
    await waitFor(() => {
      expect(socketConnectionMocks.mockOn.mock.calls.length).toBeGreaterThan(0);

      const [, workResponseHandler] = socketConnectionMocks.mockOn.mock.calls.find(([channel]) => channel === 'WorkResponse-facefeed');

      workResponseHandler(mockResponseDataCompressed);
    });

    const result = await resultPromise;

    expect(result).toEqual({ data: 'mockParsedResult' });

    expect(parseResult).toHaveBeenCalledWith(mockResponseDataDecompressed);

    expect(socketConnectionMocks.mockOn).toHaveBeenCalledTimes(3);
    expect(socketConnectionMocks.mockOn.mock.calls.map(([eventName]) => eventName)).toMatchSnapshot('EventNames');
  });

  it('Returns an error if there is error in the response.', async () => {
    socketConnectionMocks.mockOn.mockImplementation(async (channelName, cb) => {
      let response = null;

      if (channelName.match('WorkerInfo')) {
        response = {
          podInfo: {
            name: 'worker-pod',
            creationTimestamp: '2022-04-29T07:48:47.000Z',
            phase: 'Pending',
          },
        };
      }

      if (channelName.match('WorkResponse')) {
        response = {
          error: true,
          errorCode: 'MOCK_ERROR_CODE',
          userMessage: 'Mock worker error message',
        };
      }

      cb({ response });
    });

    expect(async () => {
      await dispatchWorkRequest(experimentId, body, timeout, 'facefeed', null, dispatchMock);
    }).rejects.toEqual(new Error('MOCK_ERROR_CODE: Mock worker error message'));
  });
});

describe('seekFromS3 unit tests', () => {
  const result = 'someResult';

  const validSignedUrl = 'https://s3.mock/validSignedUrl';
  const invalidSignedUrl = 'https://s3.mock/invalidSignedUrl';
  const notFoundSignedUrl = 'https://s3.mock/notFoundSignedUrl';

  const s3ErrorResponse = new Response('Forbidden', { status: 403 });
  const notFoundErrorResponse = new Response('NotFound', { status: 404 });

  beforeAll(async () => {
    fetchMock.mockIf(/.*/, (req) => {
      const path = req.url;

      if (path.endsWith(validSignedUrl)) return Promise.resolve(result);
      if (path.endsWith(invalidSignedUrl)) return Promise.resolve(s3ErrorResponse);
      if (path.endsWith(notFoundSignedUrl)) return Promise.resolve(notFoundErrorResponse);

      return {
        status: 500,
        body: 'Something eror with test',
      };
    });
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('Should return null when response status is not found', async () => {
    const finalResult = await seekFromS3(taskName, notFoundSignedUrl);

    expect(finalResult).toBeNull();
  });

  it('Should return results correctly', async () => {
    unpackResult.mockReturnValueOnce('mockUnpackedResult');
    parseResult.mockReturnValueOnce('mockParsedResult');

    const finalResult = await seekFromS3(taskName, validSignedUrl);

    expect(finalResult).toEqual('mockParsedResult');

    expect(unpackResult).toHaveBeenCalledTimes(1);
    const response = unpackResult.mock.calls[0][0];
    const mockResponsePayload = await response.text();
    expect(mockResponsePayload).toEqual(result);

    expect(parseResult).toHaveBeenCalledWith('mockUnpackedResult', taskName);
  });

  it('Should throw an error if fetching returns an error', async () => {
    await expect(async () => {
      await seekFromS3(taskName, invalidSignedUrl);
    }).rejects.toThrow(new Error(`Error ${s3ErrorResponse.status}: ${s3ErrorResponse.text}`, { cause: s3ErrorResponse }));
  });
});
