import _ from 'lodash';
import { SparseMatrix } from 'mathjs';

import {
  GENES_EXPRESSION_ERROR,
  DOWNSAMPLED_GENES_LOADING,
  DOWNSAMPLED_GENES_LOADED,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

const loadDownsampledGeneExpressionDebounced = _.debounce(
  async (
    experimentId,
    genes,
    componentUuid,
    dispatch,
    getState,
  ) => {
    const state = getState();

    const {
      groupedTracks,
      selectedCellSet,
      selectedPoints,
    } = state.componentConfig[componentUuid]?.config;

    const hiddenCellSets = Array.from(state.cellSets.hidden);

    // Dispatch loading state.
    dispatch({
      type: DOWNSAMPLED_GENES_LOADING,
      payload: {
        experimentId,
        componentUuid,
        genes,
      },
    });

    const body = {
      name: 'GeneExpression',
      genes,
      downsampled: true,
      downsampleSettings: {
        selectedCellSet,
        groupedTracks,
        selectedPoints,
        hiddenCellSets,
      },
    };

    const timeout = getTimeoutForWorkerTask(getState(), 'GeneExpression');

    try {
      let requestETag;

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
              type: DOWNSAMPLED_GENES_LOADING,
              payload: {
                experimentId,
                componentUuid,
                ETag,
              },
            });
          },
        },
      );

      // If the ETag is different, that means that a new request was sent in between
      // So we don't need to handle this outdated result
      if (getState().genes.expression.downsampledETag !== requestETag) {
        return;
      }

      const rawExpression = SparseMatrix.fromJSON(rawExpressionJson);
      const truncatedExpression = SparseMatrix.fromJSON(truncatedExpressionJson);
      const zScore = SparseMatrix.fromJSON(zScoreJson);

      dispatch({
        type: DOWNSAMPLED_GENES_LOADED,
        payload: {
          componentUuid,
          genes,
          newGenes: {
            orderedGeneNames,
            stats,
            rawExpression,
            truncatedExpression,
            zScore,
          },
          cellOrder,
        },
      });
    } catch (error) {
      dispatch({
        type: GENES_EXPRESSION_ERROR,
        payload: {
          experimentId,
          componentUuid,
          genes,
          error,
        },
      });
    }
  }, 1000,
);

const loadDownsampledGeneExpression = (
  experimentId,
  genes,
  componentUuid,
) => async (
  dispatch, getState,
) => loadDownsampledGeneExpressionDebounced(experimentId, genes, componentUuid, dispatch, getState);

export default loadDownsampledGeneExpression;
