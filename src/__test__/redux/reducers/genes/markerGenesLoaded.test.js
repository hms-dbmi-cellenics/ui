import constructInitialState from 'redux/reducers/genes/constructInitialState';
import markerGenesLoadedReducer from 'redux/reducers/genes/markerGenesLoaded';
import { getOneGeneMatrix } from '__test__/utils/ExpressionMatrix/testMatrixes';

describe('markerGenesLoaded', () => {
  it('returns correct state', () => {
    const genes = ['geneA'];

    const newState = markerGenesLoadedReducer(constructInitialState(), {
      payload: {
        genes,
        data: getOneGeneMatrix('geneA'),
        plotUuid: 'interactiveHeatmap',
      },
    });

    expect(newState).toMatchSnapshot();
  });
});
