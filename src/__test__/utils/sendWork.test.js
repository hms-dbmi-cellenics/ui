import { v4 as uuidv4 } from 'uuid';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import connectionPromise from '../../utils/socketConnection';
import sendWork from '../../utils/sendWork';

enableFetchMocks();
jest.mock('../../utils/socketConnection');
jest.mock('uuid');
jest.mock('moment', () => () => jest.requireActual('moment')('4022-01-01T00:00:00.000Z'));

let result = {
  results: [
    {
      body: JSON.stringify({
        hello: 'world',
      }),
    },
  ],
  response: { error: false },
};

const mockOn = jest.fn(async (x, f) => {
  f(result);
});

const mockEmit = jest.fn();
const io = { emit: mockEmit, on: mockOn, id: '5678' };
connectionPromise.mockImplementation(new Promise((resolve) => {
  resolve(io);
}));

uuidv4.mockImplementation(() => 'my-random-uuid');

describe('sendWork unit tests', () => {
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
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ worker: { started: true, ready: true } })),
    );
  });

  it('Sends work to the backend when called and returns valid response.', async () => {
    const response = await sendWork(
      experimentId, timeout, body,
    );

    expect(mockEmit).toHaveBeenCalledWith('WorkRequest', {
      uuid: 'my-random-uuid',
      socketId: '5678',
      experimentId: '1234',
      timeout: '4022-01-01T00:00:30.000Z',
      body: { name: 'ImportantTask', type: 'fake task' },
    });
    expect(mockOn).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      results: [{ body: '{"hello":"world"}' }],
      response: { error: false },
    });
  });

  it('Returns an error if there is error in the response.', async (done) => {
    const flushPromises = () => new Promise(setImmediate);

    result = {
      results: [
        {
          body: JSON.stringify({
            hello: 'world 2',
          }),
        },
      ],
      response: { error: 'The backend returned an error' },
    };

    expect(sendWork(experimentId, timeout, body)).rejects.toEqual(new Error('The backend returned an error'));
    await flushPromises();

    expect(mockEmit).toHaveBeenCalledWith('WorkRequest', {
      uuid: 'my-random-uuid',
      socketId: '5678',
      experimentId: '1234',
      timeout: '4022-01-01T00:00:30.000Z',
      body: { name: 'ImportantTask', type: 'fake task' },
    });

    done();
  });
});
