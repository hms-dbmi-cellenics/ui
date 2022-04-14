import markerGenesErrorReducer from 'redux/reducers/genes/markerGenesError';

describe('markerGenesError', () => {
  it('returns correct state', () => {
    const initialState = {
      markers: {},
    };

    const newState = markerGenesErrorReducer(initialState, {});

    expect(newState).toMatchSnapshot();
  });
});
