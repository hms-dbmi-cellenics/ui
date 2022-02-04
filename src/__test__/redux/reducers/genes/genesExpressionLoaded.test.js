import genesExpressionLoadedReducer from 'redux/reducers/genes/genesExpressionLoaded';

describe('genesExpressionLoaded reducer', () => {
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

    const newState = genesExpressionLoadedReducer(initialState, {
      payload: {
        genes,
        data,
        plotUuid: 'interactiveHeatmap',
      },
    });

    expect(newState).toMatchSnapshot();
  });
});
