import * as socketConnectionMocks from 'utils/socketConnection';
import * as fetchWorkResponseMocks from 'utils/work/fetchWork';

import SocketMock from 'socket.io-mock';

const socketMock = new SocketMock();

jest.mock('utils/work/fetchWork', () => {
  const mockSeekFromS3 = jest.fn();
  const originalModule = jest.requireActual('utils/work/fetchWork');

  return {
    __esModule: true, // Use it when dealing with esModules
    ...originalModule,
    fetchWork: mockSeekFromS3,
  };
});

jest.mock('aws-amplify', () => ({
  configure: () => ({
    Storage: {
      AWSS3: {
        bucket: 'biomage-originals-test',
      },
    },
  }),
  Storage: {
    get: async (ETag) => `http://mock.s3.amazonaws.com/${ETag}`,
  },
  Auth: {
    federatedSignIn: jest.fn(),
    signOut: jest.fn(),
    currentAuthenticatedUser: jest.fn().mockImplementation(async () => ({
      username: 'mockuser',
      attributes: {
        email: 'mock@user.name',
        name: 'Mocked User',
      },
    })),
    currentSession: () => ({
      getIdToken: (() => ({
        getJwtToken: () => 'fakeJwtToken',
      })),
    }),
  },
  Hub: {
    listen: jest.fn(),
  },
}));

jest.mock('utils/socketConnection', () => {
  const mockEmit = jest.fn();
  const mockOn = jest.fn();
  return {
    __esModule: true,
    default: new Promise((resolve) => {
      resolve({ emit: mockEmit, on: mockOn, id: '1234' });
    }),
    mockEmit,
    mockOn,
  };
});

// To mock worker response, modify the response returned from the API
// Set to null to force fetch from API
fetchWorkResponseMocks.fetchWork.mockImplementation(() => null);

// Set up socket emitter mock
socketConnectionMocks.mockEmit.mockImplementation((workRequestType, requestBody) => {
  const responseBody = { response: { error: false } };

  // After emitting, send reply to listener
  socketMock.socketClient.emit(`WorkResponse-${requestBody.ETag}`, responseBody);
});

// Set up socket listener mock
socketConnectionMocks.mockOn.mockImplementation((channel, f) => {
  socketMock.on(channel, (responseBody) => f(responseBody));
});
