import ExpressionMatrix from 'utils/ExpressionMatrix/ExpressionMatrix';

const initialViewState = {
  fetching: false,
  error: false,
  data: [],
};

const getInitialState = () => ({
  properties: {
    loading: [],
    views: {},
    data: {},
  },
  expression: {
    views: {},
    full: {
      loading: [],
      error: false,
      ETag: null,
      matrix: new ExpressionMatrix(),
    },
    downsampled: {
      loading: false,
      error: false,
      cellIds: [],
      downsampleType: null,       // 'bucketed' | 'precomputed' | null
      lastFetchSettings: null,    // { downsampleType, selectedCellSet, groupedTracks, cellIdsKey }
      matrix: new ExpressionMatrix(),
    },
  },
  selected: [],
  focused: undefined,
  markers: {
    loading: false,
    error: false,
    ETag: null,
  },
});

export { initialViewState };
export default getInitialState;
