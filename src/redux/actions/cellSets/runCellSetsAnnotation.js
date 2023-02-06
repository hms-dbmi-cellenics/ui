import {
  CELL_SETS_ERROR, CELL_SETS_CLUSTERING_UPDATING,
} from 'redux/actionTypes/cellSets';

import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import fetchWork from 'utils/work/fetchWork';

const runCellSetsAnnotation = (experimentId, species, tissue) => async (dispatch, getState) => {
  // const {
  //   error, updatingCellSets, loading,
  // } = getState().cellSets;

  // const { experimentSettings: { processing } } = getState();

  // const { method } = processing.configureEmbedding.clusteringSettings;

  // if ((loading && updatingCellSets) || error) {
  //   return null;
  // }

  const body = {
    name: 'GetScTypeAnnotation',
    cellSetName: 'Louvain clusters',
    species,
    tissue,
  };

  dispatch({
    type: CELL_SETS_CLUSTERING_UPDATING,
  });

  const timeout = getTimeoutForWorkerTask(getState(), 'ClusterCells');

  try {
    await fetchWork(
      experimentId,
      body,
      getState,
      dispatch,
      {
        timeout,
        broadcast: true,
      },
    );
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

export default runCellSetsAnnotation;
