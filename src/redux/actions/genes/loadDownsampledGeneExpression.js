import { SparseMatrix } from 'mathjs';

import {
  DOWNSAMPLED_GENES_EXPRESSION_LOADING,
  DOWNSAMPLED_GENES_EXPRESSION_ERROR,
  GENES_EXPRESSION_LOADED,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import updateDownsampledCellOrder from 'redux/actions/genes/updateDownsampledCellOrder';
import updateDownsampledGeneOrder from 'redux/actions/genes/updateDownsampledGeneOrder';
import getHeatmapCellOrder from 'utils/work/getHeatmapCellOrder';

/**
 * Loads gene expression for the heatmap.
 * Wrapper that:
 * 1. Makes the gene expression work request
 * 2. Computes and stores cellOrder
 * 3. Stores orderedGeneNames from the work request response
 * 4. Updates the shared expression matrix
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

  // Compute cell order upfront
  const state = getState();
  const {
    groupedTracks,
    selectedCellSet: selectedCellSetKey,
    selectedPoints,
  } = state.componentConfig[componentUuid]?.config;

  const hiddenCellSets = withHiddenCellSets ? Array.from(state.cellSets.hidden) : [];
  const cellSetData = state.cellSets;
  const cellOrder = getHeatmapCellOrder(
    selectedCellSetKey,
    groupedTracks,
    selectedPoints,
    hiddenCellSets,
    cellSetData,
  );

  // Dispatch loading state for heatmap
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
      genes,
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

    // Update the shared expression matrix with the loaded data
    // Pass the INPUT genes (marker order), not orderedGeneNames (worker order)
    // Vitessce will look them up by name and display in the order we specify
    dispatch({
      type: GENES_EXPRESSION_LOADED,
      payload: {
        componentUuid,
        genes,
        newGenes: {
          orderedGeneNames,
          stats,
          rawExpression,
        },
      },
    });

    // Store the ordered gene names in downsampled state
    dispatch(updateDownsampledGeneOrder(componentUuid, orderedGeneNames));

    // Store the cell order in downsampled state
    dispatch(updateDownsampledCellOrder(componentUuid));
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
