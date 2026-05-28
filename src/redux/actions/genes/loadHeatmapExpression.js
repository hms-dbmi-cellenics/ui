import _ from 'lodash';
import { SparseMatrix } from 'mathjs';

import {
  HEATMAP_EXPRESSION_LOADING,
  HEATMAP_EXPRESSION_LOADED,
  HEATMAP_EXPRESSION_ERROR,
} from 'redux/actionTypes/genes';

import loadGeneExpression from 'redux/actions/genes/loadGeneExpression';
import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import upperCaseArray from 'utils/upperCaseArray';
import getHeatmapCellOrder, { getBuckets } from 'utils/work/getHeatmapCellOrder';
import { getCellSets } from 'redux/selectors';

const LARGE_DATASET_THRESHOLD = 50000;

const getTotalCells = (cellSets) => {
  const sampleNode = cellSets.hierarchy?.find((node) => node.key === 'sample');
  return sampleNode?.children?.reduce((sum, child) => {
    const cellIds = cellSets.properties[child.key]?.cellIds;
    return sum + (cellIds?.size || 0);
  }, 0) || 0;
};

const findLoadedGenesInDownsampled = (matrix, genes) => {
  const storedGenes = matrix.getStoredGenes();
  const genesToLoad = [...genes].filter(
    (gene) => !new Set(upperCaseArray(storedGenes)).has(gene.toUpperCase()),
  );
  const genesAlreadyLoaded = storedGenes.filter(
    (gene) => upperCaseArray(genes).includes(gene.toUpperCase()),
  );
  return { genesToLoad, genesAlreadyLoaded };
};

const settingsHaveChanged = (lastFetchSettings, newSettings) => {
  if (!lastFetchSettings) return true;
  if (lastFetchSettings.downsampleType !== newSettings.downsampleType) return true;
  if (newSettings.downsampleType === 'bucketed') {
    return (
      lastFetchSettings.selectedCellSet !== newSettings.selectedCellSet
      || !_.isEqual(lastFetchSettings.groupedTracks, newSettings.groupedTracks)
    );
  }
  // precomputed: compare by serialized cell IDs
  return lastFetchSettings.cellIdsKey !== newSettings.cellIdsKey;
};

/**
 * Loads heatmap expression data, routing to the appropriate strategy based on dataset size.
 *
 * Small datasets (< 50k cells): delegates to loadGeneExpression (full matrix).
 * Bucketed (≥ 50k, capped bucket total < 50k):
 *   sends { downsampleSettings: { selectedCellSet, groupedTracks } }.
 *   The worker samples up to 1000 cells per bucket;
 *   client does a second-pass proportional downsampling.
 * Precomputed (capped bucket total ≥ 50k):
 *   sends { downsampleSettings: { cellIds } } with an explicit
 *   pre-computed list of cells (up to 5000, hidden sets factored in).
 *
 * @param {string} experimentId
 * @param {string[]} genes
 * @param {object} options
 * @param {string}   options.selectedCellSet
 * @param {string[]} options.groupedTracks
 * @param {string[]} options.hiddenCellSets  - computed by computeHiddenCellSets
 * @param {string}   options.plotUuid        - used only for small dataset delegation
 */
const loadHeatmapExpression = (
  experimentId,
  genes,
  {
    selectedCellSet, groupedTracks, hiddenCellSets, plotUuid,
  },
) => async (dispatch, getState) => {
  if (!genes?.length) return null;

  const state = getState();
  const cellSets = getCellSets()(state);

  if (!cellSets.accessible) return null;

  const totalCells = getTotalCells(cellSets);

  // ── Small dataset: use full expression matrix ────────────────────────────
  if (totalCells < LARGE_DATASET_THRESHOLD) {
    return dispatch(loadGeneExpression(experimentId, genes, plotUuid));
  }

  // ── Large dataset: determine bucketed vs precomputed ────────────────────────────
  const { buckets } = getBuckets(selectedCellSet, groupedTracks, [], cellSets);
  const cappedTotal = buckets.reduce((sum, b) => sum + Math.min(b.size, 1000), 0);
  const isBucketed = cappedTotal < LARGE_DATASET_THRESHOLD;
  const downsampleType = isBucketed ? 'bucketed' : 'precomputed';

  let cellIdsToRequest = null;
  if (!isBucketed) {
    cellIdsToRequest = getHeatmapCellOrder(
      selectedCellSet, groupedTracks, hiddenCellSets, cellSets, 5000,
    );
  }

  const newSettings = {
    downsampleType,
    selectedCellSet,
    groupedTracks,
    cellIdsKey: cellIdsToRequest ? cellIdsToRequest.join(',') : null,
  };

  const { downsampled } = state.genes.expression;

  // Don't issue a new request if already loading
  if (downsampled.loading) return null;

  const changed = settingsHaveChanged(downsampled.lastFetchSettings, newSettings);

  const { genesToLoad, genesAlreadyLoaded } = changed
    ? { genesToLoad: genes, genesAlreadyLoaded: [] }
    : findLoadedGenesInDownsampled(downsampled.matrix, genes);

  // Nothing to do — all genes already in downsampled matrix with same settings
  if (genesToLoad.length === 0) return null;

  dispatch({ type: HEATMAP_EXPRESSION_LOADING });

  // For append requests (settings unchanged), always send the stored cell IDs so the worker
  // returns expression for exactly the same cells already in the matrix. Without this,
  // bucketed requests would re-sample randomly and produce expression for different cells.
  const downsampleSettings = !changed
    ? { cellIds: downsampled.cellIds }
    : isBucketed
      ? { selectedCellSet, groupedTracks }
      : { cellIds: cellIdsToRequest };

  const body = {
    name: 'GeneExpression',
    genes: genesToLoad,
    downsampleSettings,
  };

  const timeout = getTimeoutForWorkerTask(state, 'GeneExpression');

  try {
    const {
      orderedGeneNames,
      rawExpression: rawExpressionJson,
      stats,
      cellIds: workerCellIds,
    } = await fetchWork(experimentId, body, getState, dispatch, { timeout });

    const rawExpression = SparseMatrix.fromJSON(rawExpressionJson);

    dispatch({
      type: HEATMAP_EXPRESSION_LOADED,
      payload: {
        newGenes: { orderedGeneNames, rawExpression, stats },
        cellIds: changed ? (workerCellIds ?? cellIdsToRequest) : downsampled.cellIds,
        downsampleType,
        lastFetchSettings: newSettings,
        isAppend: !changed,
        genesAlreadyLoaded,
      },
    });
  } catch (error) {
    dispatch({
      type: HEATMAP_EXPRESSION_ERROR,
      payload: { error },
    });
  }

  return null;
};

export { LARGE_DATASET_THRESHOLD };
export default loadHeatmapExpression;
