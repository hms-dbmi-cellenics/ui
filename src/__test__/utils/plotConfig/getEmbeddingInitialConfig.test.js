import { getEmbeddingInitialConfig, isMarkerCustomized } from 'utils/plotConfig/getEmbeddingInitialConfig';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

const mockCellSets = (numCells) => ({
  hierarchy: [{ key: 'sample', children: [{ key: 'sample-1' }] }],
  properties: {
    'sample-1': { cellIds: new Set([...Array(numCells).keys()]) },
  },
});

describe('getEmbeddingInitialConfig', () => {
  const plotType = 'embeddingCategorical';
  const standardMarker = initialPlotConfigStates[plotType].marker;

  it('enlarges points for small datasets', () => {
    const config = getEmbeddingInitialConfig(plotType, mockCellSets(728));

    expect(config.marker.size).toEqual(27);
    expect(config.marker.outline).toEqual(standardMarker.outline);
    expect(config.defaultValues.cellCountDefaults).toBe(true);
  });

  it('caps point size for very small datasets', () => {
    const config = getEmbeddingInitialConfig(plotType, mockCellSets(100));

    expect(config.marker.size).toEqual(30);
  });

  it('keeps standard marker for medium datasets', () => {
    const config = getEmbeddingInitialConfig(plotType, mockCellSets(50000));

    expect(config.marker).toEqual(standardMarker);
    expect(config.defaultValues?.cellCountDefaults).toBeUndefined();
  });

  it('shrinks points and removes outline for large datasets', () => {
    const config = getEmbeddingInitialConfig(plotType, mockCellSets(100001));

    expect(config.marker.size).toEqual(1);
    expect(config.marker.outline).toBe(false);
    expect(config.defaultValues.cellCountDefaults).toBe(true);
  });

  it('does not adjust non-embedding plots', () => {
    const config = getEmbeddingInitialConfig('violin', mockCellSets(100));

    expect(config.marker).toEqual(initialPlotConfigStates.violin.marker);
  });

  it('detects customized markers', () => {
    expect(isMarkerCustomized(standardMarker, plotType)).toBe(false);
    expect(isMarkerCustomized({ ...standardMarker, size: 30 }, plotType)).toBe(true);
  });
});
