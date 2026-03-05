import getInitialState from 'redux/reducers/genes/getInitialState';
import markerGenesLoadedReducer from 'redux/reducers/genes/markerGenesLoaded';

describe('markerGenesLoaded', () => {
  it('returns correct state', () => {
    const newState = markerGenesLoadedReducer(getInitialState(), {
      payload: {
        data: {
          orderedGeneNames: ['geneA'],
        },
        plotUuid: 'interactiveHeatmap',
        ETag: 'test-etag-123',
      },
    });

    expect(newState).toMatchSnapshot();
  });
});
