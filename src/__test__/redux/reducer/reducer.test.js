import configureMockStore from 'redux-mock-store';
import reducers from '../../../redux/reducers';
import * as types from '../../../redux/actions/actionType';

const mockStore = configureMockStore([]);

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

describe('cellSetsReducer', () => {
  it('Reduces the correct state when loading cell sets', () => expect(
    reducers({}, {
      experimentId: '1234',
      data: [{ one: '1' }, { two: '2' }],
      type: types.LOAD_CELL_SETS,
    }).cellSets,
  ).toEqual({
    data: [{ one: '1' }, { two: '2' }],
  }));

  it('Reduces the correct state when updating cell sets', () => expect(
    reducers({}, {
      experimentId: '1234',
      data: [{ one: '1' }, { two: '2' }],
      type: types.UPDATE_CELL_SETS,
    }).cellSets,
  ).toEqual({
    data: [{ one: '1' }, { two: '2' }],
  }));

  it('Reduces the correct state when creating cluster and scratchpad exists', () => {
    const store = mockStore({
      cellSets: {
        data: [
          {
            name: 'Scratchpad',
            key: 'scratchpad',
            rootNode: true,
            children: [],
          },
        ],
      },
    });
    expect(
      reducers(store.getState(), {
        experimentId: '1234',
        data: { name: 'new cluster', key: 'myawesomekey', color: 'blue' },
        type: types.CREATE_CLUSTER,
      }).cellSets,
    ).toEqual({
      data: [
        {
          name: 'Scratchpad',
          key: 'scratchpad',
          rootNode: true,
          children: [
            { name: 'new cluster', key: 'myawesomekey', color: 'blue' },
          ],
        },
      ],
    });
  });
  it('Reduces the correct state when creating cluster and scratchpad does not exist', () => {
    expect(
      reducers({}, {
        experimentId: '1234',
        data: { name: 'new cluster', key: 'myawesomekey', color: 'blue' },
        type: types.CREATE_CLUSTER,
      }).cellSets,
    ).toEqual({
    });
  });
});
