import { SparseMatrix } from 'mathjs';
import loadCellSets from 'redux/actions/cellSets/loadCellSets';
import { getCellSetsHierarchyByKeys } from 'redux/selectors';
import {
  MARKER_GENES_ERROR, MARKER_GENES_LOADING, MARKER_GENES_LOADED,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

// Check that the cell sets within the selected cellSetKey didn't change
// e.g., if cell set was deleted we can't use cache
const getSelectedCellSet = async (experimentId, cellSetKey, dispatch, getState) => {
  await dispatch(loadCellSets(experimentId));

  const hierarchy = getCellSetsHierarchyByKeys([cellSetKey])(getState());
  console.log('children', hierarchy);
  // TODO ask martin if returning the keys is enough or we actually need
  // to invalidate results depending on the name of the cell set
  const cellSetsKeys = hierarchy[0].children.map((cellSet) => cellSet.key);
  console.log('cellSetsKeys', cellSetsKeys);

  return cellSetsKeys;
};

const loadMarkerGenes = (
  experimentId, plotUuid, options = {},
) => async (dispatch, getState) => {
  const {
    numGenes = 5,
    groupedTracks = ['sample', 'louvain'],
    selectedCellSetKey = 'louvain',
    selectedPoints = 'All',
    hiddenCellSets = [],
  } = options;

  const cellSets = await getSelectedCellSet(experimentId, selectedCellSetKey, dispatch, getState);

  const downsampleSettings = {
    selectedCellSet: selectedCellSetKey,
    cellSets,
    groupedTracks,
    selectedPoints,
    hiddenCellSets: Array.from(hiddenCellSets),
  };

  const body = {
    name: 'MarkerHeatmap',
    nGenes: numGenes,
    downsampleSettings,
  };
  console.log('marker-heatmp/body', body);

  try {
    const timeout = getTimeoutForWorkerTask(getState(), 'MarkerHeatmap');

    // TODO ask martin if it's fine to use null as default
    let requestETag = null;

    const {
      orderedGeneNames,
      rawExpression: rawExpressionJson,
      truncatedExpression: truncatedExpressionJson,
      zScore: zScoreJson,
      stats,
      cellOrder,
    } = await fetchWork(
      experimentId,
      body,
      getState,
      dispatch,
      {
        timeout,
        onETagGenerated: (ETag) => {
          dispatch({ type: MARKER_GENES_LOADING, payload: { ETag } });
          requestETag = ETag;
        },
      },
    );

    // If the ETag is different, that means that a new request was sent in between
    // So we don't need to handle this outdated result
    if (getState().genes.expression.downsampled.ETag !== requestETag) {
      return;
    }

    const rawExpression = SparseMatrix.fromJSON(rawExpressionJson);
    const truncatedExpression = SparseMatrix.fromJSON(truncatedExpressionJson);
    const zScore = SparseMatrix.fromJSON(zScoreJson);

    dispatch({
      type: MARKER_GENES_LOADED,
      payload: {
        plotUuid,
        data: {
          orderedGeneNames,
          rawExpression,
          truncatedExpression,
          zScore,
          stats,
          cellOrder,
        },
      },
    });
  } catch (e) {
    if (e.message.includes('No cells found')) {
      dispatch({
        type: MARKER_GENES_LOADED,
        payload: {
          plotUuid,
          data: {
            orderedGeneNames: [],
            rawExpression: new SparseMatrix(),
            truncatedExpression: new SparseMatrix(),
            zScore: new SparseMatrix(),
            stats: {},
            cellOrder: [],
          },
        },
      });

      return;
    }

    const errorMessage = handleError(e, endUserMessages.ERROR_FETCH_MARKER_GENES, undefined, false);

    dispatch({
      type: MARKER_GENES_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};

export default loadMarkerGenes;
