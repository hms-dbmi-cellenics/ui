/* eslint-disable no-param-reassign */
import produce from 'immer';

const experimentsBackendStatusUpdated = produce((draft, action) => {
  const { experimentId, backendStatus } = action.payload;

  draft[experimentId].meta.backendStatus = backendStatus;
});

export default experimentsBackendStatusUpdated;
