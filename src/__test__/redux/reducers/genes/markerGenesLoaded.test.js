import markerGenesLoadedReducer from '../../../../redux/reducers/genes/markerGenesLoaded';

describe('markerGenesLoaded', () => {
  it('returns correct state', () => {
    const initialState = {
      expression: {
        views: {},
        data: {},
      },
      markers: {},
    };

    const genes = ['geneA'];
    const data = {
      geneA: {
        rawExpression: {
          expression: [1],
          mean: 1,
          stdev: 1,
        },
      },
    };

    const newState = markerGenesLoadedReducer(initialState, {
      payload: {
        genes,
        data,
        plotUuid: 'interactiveHeatmap',
      },
    });

    expect(newState).toMatchSnapshot();
  });
});
