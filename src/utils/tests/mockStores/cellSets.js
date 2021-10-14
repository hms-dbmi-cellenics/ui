import initialCellSetsState from 'redux/reducers/cellSets/initialState';

const cellSets = () => ({
  cellSets: {
    ...initialCellSetsState,
    properties: {
      test: {
        name: 'Test',
        cellIds: new Set(),
        type: 'firstType',
      },
      'test-1': {
        name: 'Test-1',
        cellIds: new Set([1, 2, 3]),
      },
      'test-2': {
        name: 'Test-2',
        cellIds: new Set([4, 5, 6]),
      },
      anotherTest: {
        name: 'AnotherTest',
        cellIds: new Set(),
        type: 'anotherType',
      },
      'anotherTest-1': {
        name: 'anotherTest-1',
        cellIds: new Set([9, 10, 11]),
      },
      'anotherTest-2': {
        name: 'anotherTest-1',
        cellIds: new Set([12, 13, 14]),
      },
    },
    hierarchy: [
      {
        key: 'test',
        children: [
          { key: 'test-1' },
          { key: 'test-2' },
        ],
      },
      {
        key: 'anotherTest',
        children: [
          { key: 'anotherTest-1' },
          { key: 'anotherTest-2' },
        ],
      },
    ],
    loading: false,
    error: false,
  },
});

export default cellSets;
