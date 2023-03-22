import markerGenesLoadingReducer from 'redux/reducers/genes/markerGenesLoading';

describe('markerGenesLoading', () => {
  it('returns correct state', () => {
    const initialState = {
      markers: {},
    };

    const newState = markerGenesLoadingReducer(initialState, { payload: { ETag: 'new-etag' } });

    expect(newState).toMatchSnapshot();
  });
});
