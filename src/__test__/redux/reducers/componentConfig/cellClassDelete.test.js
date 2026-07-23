import cellClassDelete from 'redux/reducers/componentConfig/cellClassDelete';
import { CELL_CLASS_DELETE } from 'redux/actionTypes/cellSets';

const deleteAction = (key) => ({ type: CELL_CLASS_DELETE, payload: { key } });

describe('cellClassDelete (componentConfig)', () => {
  it('removes the deleted cell class from heatmap groupedTracks', () => {
    const state = {
      interactiveHeatmap: {
        config: { groupedTracks: ['louvain', 'CASSIA-Gut-Human-1', 'sample'] },
      },
    };

    const newState = cellClassDelete(state, deleteAction('CASSIA-Gut-Human-1'));

    expect(newState.interactiveHeatmap.config.groupedTracks).toEqual(['louvain', 'sample']);
  });

  it('leaves groupedTracks untouched when it does not contain the deleted key', () => {
    const state = {
      interactiveHeatmap: { config: { groupedTracks: ['louvain', 'sample'] } },
    };

    const newState = cellClassDelete(state, deleteAction('CASSIA-Gut-Human-1'));

    expect(newState.interactiveHeatmap.config.groupedTracks).toEqual(['louvain', 'sample']);
  });

  // Regression: plots whose config has no groupedTracks used to throw
  // "Cannot read properties of undefined (reading 'includes')".
  it('does not throw for plot configs without groupedTracks', () => {
    const state = {
      embeddingCategoricalMain: { config: { selectedCellSet: 'louvain' } },
      violinMain: { config: {} },
      noConfigPlot: {},
    };

    expect(
      () => cellClassDelete(state, deleteAction('CASSIA-Gut-Human-1')),
    ).not.toThrow();
  });
});
