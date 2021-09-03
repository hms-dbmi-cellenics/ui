import { fetchCachedWork } from '../../../utils/cacheRequest';
import {
  TRAJECTORY_ANALYSIS_ERROR,
  TRAJECTORY_ANALYSIS_LOADED,
  TRAJECTORY_ANALYSIS_LOADING,
} from '../../actionTypes/trajectoryAnalysis';

const loadTrajectoryAnalysis = (experimentId, rootNode) => async (dispatch, getState) => {
  const { loading } = getState().trajectoryAnalysis;

  if (loading || !rootNode) return;

  const cellSetKey = rootNode.split('/')[1];

  const { cellIds } = getState().cellSets.properties[cellSetKey];
  const { status } = getState().backendStatus[experimentId];
  const { method } = getState().experimentSettings.processing.configureEmbedding.embeddingSettings;

  dispatch({
    type: TRAJECTORY_ANALYSIS_LOADING,
  });

  const body = {
    name: 'TrajectoryAnalysis',
    method,
    cellIds: Array.from(cellIds),
  };

  try {
    const data = await fetchCachedWork(experimentId, body, status);

    dispatch({
      type: TRAJECTORY_ANALYSIS_LOADED,
      payload: {
        data,
      },
    });
  } catch (e) {
    dispatch({
      type: TRAJECTORY_ANALYSIS_ERROR,
      payload: {
        error: `Error fetching trajectory for rootNode ${rootNode}`,
      },
    });
  }
};

export default loadTrajectoryAnalysis;
