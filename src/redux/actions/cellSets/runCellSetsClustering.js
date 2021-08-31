import { fetchWork } from '../../../utils/work/fetchWork';
import {
  CELL_SETS_ERROR, CELL_SETS_CLUSTERING_UPDATING,
} from '../../actionTypes/cellSets';

const REQUEST_TIMEOUT = 5 * 60;

const runCellSetsClustering = (experimentId, resolution) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  const { experimentSettings } = getState();

  const { status } = getState().backendStatus[experimentId];

  const { processing } = experimentSettings;
  const { method } = processing.configureEmbedding.clusteringSettings;

  if (loading || error) {
    return null;
  }

  const body = {
    name: 'ClusterCells',
    cellSetName: 'Louvain clusters',
    type: method,
    cellSetKey: 'louvain',
    config: {
      resolution,
    },
  };

  dispatch({
    type: CELL_SETS_CLUSTERING_UPDATING,
  });

  try {
    await fetchWork(experimentId, body, status, {
      timeout: REQUEST_TIMEOUT,
      // This code is unused right now as we do not currently
      // support autoamtic updates of clustering information
      // based on another users' input. This is left here
      // purely as a demonstration for how `eventCallback` may
      // be used.

      // eventCallback: (err, res) => {
      //   if (err) {
      //     throw err;
      //   }

      //   const louvainSets = JSON.parse(res.results[0].body);
      //   const newCellSets = [
      //     louvainSets,
      //   ];
      //   dispatch(updateCellSetsClustering(experimentId, newCellSets));
      // },
    });
  } catch (e) {
    dispatch({
      type: CELL_SETS_ERROR,
      payload: {
        experimentId,
        error: e,
      },
    });
  }
};

export default runCellSetsClustering;
