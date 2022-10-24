import { makeStore } from 'redux/store';
import fetchWork from 'utils/work/fetchWork';

import getBackgroundExpressedGenes from 'utils/differentialExpression/getBackgroundExpressedGenes';

jest.mock('utils/work/fetchWork');

describe('getBackgroundExpressedGenes test', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    fetchWork.mockImplementation(() => Promise.resolve({
      genes: ['ENMUSG00000001', 'ENMUSG00000002', 'ENMUSG00000003'],
    }));
  });

  it('Dispatch correctly', async () => {
    const store = makeStore();
    await store.dispatch(getBackgroundExpressedGenes());

    expect(fetchWork).toHaveBeenCalledTimes(1);

    const args = fetchWork.mock.calls[0];
    const body = args[1];

    // Checking body
    expect(body).toEqual(
      expect.objectContaining({
        name: 'GetBackgroundExpressedGenes',
      }),
    );
  });

  it('Should throw error if the workResult returns an error', async () => {
    fetchWork.mockImplementation(() => Promise.reject(new Error('Error')));

    const store = makeStore();

    expect(async () => {
      await store.dispatch(getBackgroundExpressedGenes());
    }).rejects.toThrow();
  });
});
