import reducers from '../../../redux/reducers';
import * as types from '../../../redux/actions/actionType';

describe('cellInfoReducer', () => {
  it('Reduces the correct state', () => expect(
    reducers({}, {
      data: {
        cellName: 'C1',
        geneName: 'G1',
        expression: 1,
      },
      type: types.UPDATE_CELL_INFO,
    }).cellInfo,
  ).toEqual({
    cellName: 'C1',
    geneName: 'G1',
    expression: 1,
  }));
});
