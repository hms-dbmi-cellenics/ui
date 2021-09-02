import { fetchCachedWork } from '../../../utils/cacheRequest';
import {
  TRAJECTORY_ANALYSIS_ERROR,
  TRAJECTORY_ANALYSIS_LOADED,
  TRAJECTORY_ANALYSIS_LOADING,
} from '../../actionTypes/trajectoryAnalysis';

const loadTrajectoryAnalysis = (experimentId, rootNode) => async (dispatch, getState) => {
  const { loading } = getState().trajectoryAnalysis;

  if (loading) return;

  const { cellIds } = getState().cellSets.properties[rootNode];
  const { status } = getState().backendStatus[experimentId];

  dispatch({
    type: TRAJECTORY_ANALYSIS_LOADING,
  });

  const body = {
    name: 'TrajectoryAnalysis',
    cellIds: Array.from(cellIds),
  };

  try {
    const data = await fetchCachedWork(experimentId, body, status);

    console.log('== DATA');
    console.log(data);

    dispatch({
      type: TRAJECTORY_ANALYSIS_LOADED,
      payload: {
        data,
      },
    });
  } catch (e) {
    console.log('== ERROR');
    console.log(e);

    dispatch({
      type: TRAJECTORY_ANALYSIS_ERROR,
      payload: {
        error: `Error fetching trajectory for rootNode ${rootNode}`,
      },
    });
  }
};

export default loadTrajectoryAnalysis;
