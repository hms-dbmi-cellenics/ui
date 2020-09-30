import {
  updateCellInfo,
} from '../../../redux/actions/updateCellInfo';
import * as types from '../../../redux/actionTypes';
import connectionPromise from '../../../utils/socketConnection';

jest.mock('localforage');
jest.mock('../../../utils/socketConnection');

const mockOn = jest.fn(async (x, f) => {
  const res = {
    results: [
      {
        body: JSON.stringify({
          cells: ['C1', 'C2'],
          data: [
            { geneName: 'G1', expression: [1, 2] },
            { geneName: 'G2', expression: [1, 2] },
          ],
          minExpression: 0,
          maxExpression: 10,
        }),
      },
    ],
  };
  f(res);
});
const mockEmit = jest.fn();
const io = { emit: mockEmit, on: mockOn };
connectionPromise.mockImplementation(() => new Promise((resolve) => {
  resolve(io);
}));

let dispatch;

describe('updateCellInfo action', () => {
  beforeEach(() => {
    dispatch = jest.fn();
  });
  it('Fetch selected gene from API', () => {
    updateCellInfo({
      cellName: 'C1',
      geneName: 'G1',
      expression: 1,
      componentType: 'heatmap',
    })(dispatch);

    expect(dispatch).toBeCalledTimes(1);
    expect(dispatch).toBeCalledWith({
      data: {
        cellName: 'C1',
        geneName: 'G1',
        expression: 1,
        componentType: 'heatmap',
      },
      type: types.UPDATE_CELL_INFO,
    });
  });
});
