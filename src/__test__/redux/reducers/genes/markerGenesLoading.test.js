import markerGenesLoadingReducer from 'redux/reducers/genes/markerGenesLoading';

describe('markerGenesLoading', () => {
  it('returns correct state', () => {
    const initialState = {
      markers: {},
    };

    const newState = markerGenesLoadingReducer(initialState, {});

    expect(newState).toMatchSnapshot();
  });
});
