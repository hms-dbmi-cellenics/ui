import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import {
  refreshCellSets,
} from '../../../redux/actions';
import * as types from '../../../redux/actions/actionType';

let dispatch;

enableFetchMocks();

describe('refreshCellSets action', () => {
  const cellSets = {
    cellSets: [
      {
        name: 'Louvain',
        key: 'louvain',
        rootNode: true,
        children: [
          {
            name: 'one', key: 'louvain-one', color: 'blue', cellIds: ['1', '2', '3'],
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    dispatch = jest.fn();
    const resp = new Response(JSON.stringify(cellSets));
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(JSON.stringify({}));
    fetchMock.mockResolvedValueOnce(resp);
  });

  it('Sends a request to the API to reset cluster data', async () => {
    const experimentId = '1234';
    await refreshCellSets(experimentId)(dispatch);

    // I am not too happy to use setImmediate because of what they say in here:
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/setImmediate
    // I am using it because I couldn't work it out otherwise
    const flushPromises = () => new Promise(setImmediate);
    await flushPromises();

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toBeCalledWith({
      experimentId,
      type: types.LOAD_CELL_SETS,
      data: undefined,
    });
    expect(dispatch).toBeCalledWith({
      experimentId,
      type: types.LOAD_CELL_SETS,
      data: cellSets.cellSets,
    });
  });
});
