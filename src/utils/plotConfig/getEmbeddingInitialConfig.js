import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

/**
 * Gets the total cell count from cellSets
 * @param {Object} cellSets - The cellSets object from redux
 * @returns {number} Total number of cells
 */
const getTotalCellCount = (cellSets) => {
  if (!cellSets?.properties || !cellSets?.hierarchy) {
    return 0;
  }

  const sampleNode = cellSets.hierarchy.find((node) => node.key === 'sample');
  const totalCells = sampleNode?.children?.reduce((sum, child) => {
    const cellIds = cellSets.properties[child.key]?.cellIds;
    return sum + (cellIds?.size || 0);
  }, 0) || 0;

  return totalCells;
};

/**
 * Determines if a plot is an embedding preview plot used in data-processing
 * @param {string} plotType - The plot type
 * @returns {boolean}
 */
const isEmbeddingPreviewPlot = (plotType) => {
  const embeddingPreviewPlots = [
    'embeddingPreviewBySample',
    'embeddingPreviewByCellSets',
    'embeddingPreviewMitochondrialContent',
    'embeddingPreviewDoubletScore',
    'embeddingPreviewNumOfGenes',
    'embeddingPreviewNumOfUmis',
    'dataIntegrationEmbedding',
  ];
  return embeddingPreviewPlots.includes(plotType);
};

/**
 * Gets the initial configuration for an embedding plot, adjusted based on cell count.
 * For data-processing embedding plots with >100k cells:
 * - Sets marker.outline to false
 * - Sets marker.size to 1
 *
 * @param {string} plotType - The plot type
 * @param {Object} cellSets - The cellSets object from redux (optional)
 * @returns {Object} The initial plot configuration
 */
const getEmbeddingInitialConfig = (plotType, cellSets = null) => {
  const baseConfig = { ...initialPlotConfigStates[plotType] };

  // Apply conditional defaults for embedding preview plots with large datasets
  if (isEmbeddingPreviewPlot(plotType) && cellSets) {
    const totalCells = getTotalCellCount(cellSets);

    if (totalCells > 100000) {
      return {
        ...baseConfig,
        marker: {
          ...baseConfig.marker,
          outline: false,
          size: 1,
        },
        // Store the conditional defaults info for use in reset logic
        defaultValues: {
          ...baseConfig.defaultValues,
          largeDatasetDefaults: true,
          cellCount: totalCells,
        },
      };
    }
  }

  return baseConfig;
};

export { getEmbeddingInitialConfig, getTotalCellCount, isEmbeddingPreviewPlot };
