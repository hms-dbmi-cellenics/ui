import _ from 'lodash';

import getInitialState from 'redux/reducers/genes/getInitialState';
import markerGenesLoadedReducer from 'redux/reducers/genes/markerGenesLoaded';
import { getOneGeneMatrix } from '__test__/utils/ExpressionMatrix/testMatrixes';

describe('markerGenesLoaded', () => {
  it('returns correct state', () => {
    const newState = markerGenesLoadedReducer(getInitialState(), {
      payload: {
        data: {
          ...getOneGeneMatrix('geneA'),
          cellOrder: _.times(10, 1),
        },
        plotUuid: 'interactiveHeatmap',
      },
    });

    expect(newState).toMatchSnapshot();
  });
});
