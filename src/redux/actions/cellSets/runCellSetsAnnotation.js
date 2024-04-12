import {
  CELL_SETS_ERROR, CELL_SETS_CLUSTERING_UPDATING,
} from 'redux/actionTypes/cellSets';

import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import fetchWork from 'utils/work/fetchWork';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import updateCellSetsClustering from 'redux/actions/cellSets/updateCellSetsClustering';

const runCellSetsAnnotation = (experimentId, species, tissue) => async (dispatch, getState) => {
  const { error, updatingClustering, loading } = getState().cellSets;

  if ((loading && updatingClustering) || error) return;

  const body = {
    name: 'ScTypeAnnotate',
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
    const errorMessage = handleError(e, endUserMessages.ERROR_CELL_SETS_ANNOTATION_FAILED);
    dispatch({
      type: CELL_SETS_ERROR,
      payload: {
        experimentId,
        error: errorMessage,
      },
    });
    // To set the clustering status back to false
    dispatch(updateCellSetsClustering(experimentId));
  }
};

export default runCellSetsAnnotation;
