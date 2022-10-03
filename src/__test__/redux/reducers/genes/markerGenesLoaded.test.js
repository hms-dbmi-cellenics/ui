import getInitialState from 'redux/reducers/genes/getInitialState';
import markerGenesLoadedReducer from 'redux/reducers/genes/markerGenesLoaded';
import { getOneGeneMatrix } from '__test__/utils/ExpressionMatrix/testMatrixes';

describe('markerGenesLoaded', () => {
  it('returns correct state', () => {
    const genes = ['geneA'];

    const newState = markerGenesLoadedReducer(getInitialState(), {
      payload: {
        genes,
        data: getOneGeneMatrix('geneA'),
        plotUuid: 'interactiveHeatmap',
      },
    });

    expect(newState).toMatchSnapshot();
  });
});
