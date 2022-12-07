import { TRAJECTORY_NODES_SELECTION_UPDATED } from '../../actionTypes/componentConfig';

const updateTrajectoryPlotSelectedNodes = (plotUuid, nodes, action) => (dispatch) => {
  dispatch({
    type: TRAJECTORY_NODES_SELECTION_UPDATED,
    payload:
      { plotUuid, nodes, action },
  });
};

export default updateTrajectoryPlotSelectedNodes;
