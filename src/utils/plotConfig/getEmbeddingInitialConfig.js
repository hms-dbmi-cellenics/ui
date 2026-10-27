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
 * Determines if a plot is an embedding plot that should get large-dataset defaults
 * Includes both data-processing embedding preview plots and Plots-Tables embedding plots
 * @param {string} plotType - The plot type
 * @returns {boolean}
 */
const isEmbeddingPlotType = (plotType) => {
  const embeddingPlots = [
    // Data-processing embedding preview plots
    'embeddingPreviewBySample',
    'embeddingPreviewByCellSets',
    'embeddingPreviewMitochondrialContent',
    'embeddingPreviewDoubletScore',
    'embeddingPreviewNumOfGenes',
    'embeddingPreviewNumOfUmis',
    'dataIntegrationEmbedding',
    // Plots and Tables embedding plots
    'embeddingContinuous',
    'embeddingCategorical',
  ];
  return embeddingPlots.includes(plotType);
};

// Small datasets get larger points so they don't look sparse. Vega symbol size is an
// area in px²; the standard size (5) is kept from 4k cells upwards.
const getSmallDatasetMarkerSize = (totalCells) => Math.min(30, Math.round(20000 / totalCells));

/**
 * Gets the cell-count-aware marker for an embedding plot, or null if the
 * standard marker is already appropriate.
 * - >100k cells: no outline, size 1
 * - small datasets: larger points (scaled by cell count)
 *
 * @param {Object} standardMarker - The marker from the standard initial config
 * @param {number} totalCells - Total number of cells
 * @returns {Object|null}
 */
const getCellCountMarker = (standardMarker, totalCells) => {
  if (!totalCells) return null;

  if (totalCells > 100000) {
    return { ...standardMarker, outline: false, size: 1 };
  }

  const size = getSmallDatasetMarkerSize(totalCells);
  if (size > standardMarker.size) {
    return { ...standardMarker, size };
  }

  return null;
};

/**
 * Whether the marker has been changed from the standard defaults (by the user,
 * or by previously applied cell-count defaults).
 */
const isMarkerCustomized = (marker, plotType) => {
  const standardMarker = initialPlotConfigStates[plotType].marker;
  return marker.outline !== standardMarker.outline || marker.size !== standardMarker.size;
};

/**
 * Gets the initial configuration for an embedding plot, adjusted based on cell count
 * (see getCellCountMarker).
 *
 * @param {string} plotType - The plot type
 * @param {Object} cellSets - The cellSets object from redux (optional)
 * @returns {Object} The initial plot configuration
 */
const getEmbeddingInitialConfig = (plotType, cellSets = null) => {
  const baseConfig = { ...initialPlotConfigStates[plotType] };

  if (!isEmbeddingPlotType(plotType) || !cellSets) return baseConfig;

  const totalCells = getTotalCellCount(cellSets);
  const marker = getCellCountMarker(baseConfig.marker, totalCells);

  if (!marker) return baseConfig;

  return {
    ...baseConfig,
    marker,
    // Store the conditional defaults info for use in reset logic
    defaultValues: {
      ...baseConfig.defaultValues,
      cellCountDefaults: true,
      cellCount: totalCells,
    },
  };
};

export {
  getEmbeddingInitialConfig, getTotalCellCount, isEmbeddingPlotType, isMarkerCustomized,
};
