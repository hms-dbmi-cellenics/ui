import { SparseMatrix } from 'mathjs';

import {
  DOWNSAMPLED_GENES_EXPRESSION_LOADING,
  DOWNSAMPLED_GENES_EXPRESSION_ERROR,
  DOWNSAMPLED_GENES_EXPRESSION_LOADED,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import getHeatmapCellOrder from 'utils/work/getHeatmapCellOrder';
import upperCaseArray from 'utils/upperCaseArray';

const findLoadedGenes = (matrix, selectedGenes) => {
  // Check which of the genes we actually need to load.
  const storedGenes = matrix.getStoredGenes();
  const genesToLoad = [...selectedGenes].filter(
    (gene) => !new Set(upperCaseArray(storedGenes)).has(gene.toUpperCase()),
  );

  const genesAlreadyLoaded = storedGenes.filter(
    (gene) => upperCaseArray(selectedGenes).includes(gene.toUpperCase()),
  );

  return { genesToLoad, genesAlreadyLoaded };
};

/**
 * Loads gene expression for the heatmap.
 * Wrapper that:
 * 1. Checks if genes are already loaded (skips request if they are)
 * 2. Makes the gene expression work request only for missing genes
 * 3. Computes and stores cellOrder
 * 4. Stores orderedGeneNames from the work request response
 * 5. Updates the shared expression matrix
 */
const loadHeatmapGeneExpression = (
  experimentId,
  genes,
  componentUuid,
  withHiddenCellSets = false,
) => async (dispatch, getState) => {
  if (genes.length === 0) {
    return;
  }

  const state = getState();
  const { matrix } = state.genes.expression.full;
  
  // Check if all genes are already loaded
  const { genesToLoad, genesAlreadyLoaded } = findLoadedGenes(matrix, genes);
  
  // Compute cell order upfront
  const {
    groupedTracks,
    selectedCellSet: selectedCellSetKey,
    selectedPoints,
  } = state.componentConfig[componentUuid]?.config || {};

  const hiddenCellSets = withHiddenCellSets ? Array.from(state.cellSets.hidden) : [];
  const cellSetData = state.cellSets;
  const cellOrder = getHeatmapCellOrder(
    selectedCellSetKey,
    groupedTracks,
    selectedPoints,
    hiddenCellSets,
    cellSetData,
  );
  
  // If all genes are already loaded, just update the UI without fetching
  if (genesToLoad.length === 0) {
    // Dispatch that genes are loaded with existing data
    // Still recalculate cell order so it stays in sync with the new gene selection
    dispatch({
      type: DOWNSAMPLED_GENES_EXPRESSION_LOADED,
      payload: {
        componentUuid,
        genes,
        ETag: state.genes.expression.full.ETag,
        newGenes: {
          orderedGeneNames: genes,
          stats: {},
          rawExpression: null,
          cellOrder,
        },
      },
    });
    
    return;
  }

  // Dispatch loading state for heatmap (only if we need to fetch)
  dispatch({
    type: DOWNSAMPLED_GENES_EXPRESSION_LOADING,
    payload: {
      experimentId,
      componentUuid,
      genes,
      ETag: null,
    },
  });

  try {
    const body = {
      name: 'GeneExpression',
      genes: genesToLoad,
      downsampled: false,
    };

    const timeout = getTimeoutForWorkerTask(getState(), 'GeneExpression');

    const {
      orderedGeneNames,
      rawExpression: rawExpressionJson,
      stats,
    } = await fetchWork(
      experimentId, body, getState, dispatch, { timeout },
    );

    const rawExpression = SparseMatrix.fromJSON(rawExpressionJson);

    // Update the shared expression matrix with the newly loaded data
    // Use INPUT genes (marker order), not orderedGeneNames (worker order)
    // Vitessce will look them up by name and display in the order we specify
    dispatch({
      type: DOWNSAMPLED_GENES_EXPRESSION_LOADED,
      payload: {
        componentUuid,
        genes,
        ETag: null,
        newGenes: {
          orderedGeneNames,
          stats,
          rawExpression,
          cellOrder,
        },
      },
    });
  } catch (error) {
    dispatch({
      type: DOWNSAMPLED_GENES_EXPRESSION_ERROR,
      payload: {
        experimentId,
        componentUuid,
        genes,
        error,
      },
    });
  }
};

// Keep the old name as an alias for backward compatibility
export { loadHeatmapGeneExpression as loadDownsampledGeneExpression };
export default loadHeatmapGeneExpression;
