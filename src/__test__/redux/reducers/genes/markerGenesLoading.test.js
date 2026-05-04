import markerGenesLoadingReducer from 'redux/reducers/genes/markerGenesLoading';

describe('markerGenesLoading', () => {
  it('returns correct state', () => {
    const initialState = {
      markers: {},
      expression: {
        full: {
          ETag: null,
        },
      },
    };

    const newState = markerGenesLoadingReducer(initialState, { payload: { ETag: 'new-etag' } });

    expect(newState).toMatchSnapshot();
  });
});
