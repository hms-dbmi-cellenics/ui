import { SparseMatrix } from 'mathjs';

import {
  DOWNSAMPLED_GENES_EXPRESSION_LOADING,
  DOWNSAMPLED_GENES_EXPRESSION_LOADED,
  DOWNSAMPLED_GENES_EXPRESSION_ERROR,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import getCellSetsThatAffectDownsampling from 'utils/work/getCellSetsThatAffectDownsampling';

// Debounce so that we only fetch once the settings are done being set up
const loadDownsampledGeneExpression = (
  experimentId,
  genes,
  componentUuid,
  withHiddenCellSets = false,
) => async (dispatch, getState) => {
  if (genes.length === 0) {
    dispatch({
      type: DOWNSAMPLED_GENES_EXPRESSION_LOADED,
      payload: {
        componentUuid,
        genes,
      },
    });

    return;
  }

  const state = getState();

  const {
    groupedTracks,
    selectedCellSet: selectedCellSetKey,
    selectedPoints,
  } = state.componentConfig[componentUuid]?.config;

  const hiddenCellSets = withHiddenCellSets ? Array.from(state.cellSets.hidden) : [];

  const cellSets = await getCellSetsThatAffectDownsampling(
    experimentId, selectedCellSetKey, groupedTracks, dispatch, getState,
  );

  const downsampleSettings = {
    selectedCellSet: selectedCellSetKey,
    groupedTracks,
    cellSets,
    selectedPoints,
    hiddenCellSets,
  };

  const body = {
    name: 'GeneExpression',
    genes,
    downsampled: true,
    downsampleSettings,
  };

  const timeout = getTimeoutForWorkerTask(getState(), 'GeneExpression');

  try {
    let requestETag = null;

    const {
      orderedGeneNames,
      rawExpression: rawExpressionJson,
      truncatedExpression: truncatedExpressionJson,
      zScore: zScoreJson,
      stats,
      cellOrder,
    } = await fetchWork(
      experimentId, body, getState, dispatch,
      {
        timeout,
        onETagGenerated: (ETag) => {
          requestETag = ETag;

          // Dispatch loading state.
          dispatch({
            type: DOWNSAMPLED_GENES_EXPRESSION_LOADING,
            payload: {
              experimentId,
              componentUuid,
              genes,
              ETag,
            },
          });
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
      type: DOWNSAMPLED_GENES_EXPRESSION_LOADED,
      payload: {
        componentUuid,
        genes,
        newGenes: {
          orderedGeneNames,
          stats,
          rawExpression,
          truncatedExpression,
          zScore,
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

export default loadDownsampledGeneExpression;
