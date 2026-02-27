import _ from 'lodash';

import getInitialState from 'redux/reducers/genes/getInitialState';
import markerGenesLoadedReducer from 'redux/reducers/genes/markerGenesLoaded';

describe('markerGenesLoaded', () => {
  it('returns correct state', () => {
    const newState = markerGenesLoadedReducer(getInitialState(), {
      payload: {
        data: {
          orderedGeneNames: ['geneA'],
          cellOrder: _.times(10, 1),
        },
        plotUuid: 'interactiveHeatmap',
        ETag: 'test-etag-123',
      },
    });

    expect(newState).toMatchSnapshot();
  });
});
