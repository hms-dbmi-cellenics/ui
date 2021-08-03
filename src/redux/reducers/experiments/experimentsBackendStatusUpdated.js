/* eslint-disable no-param-reassign */
import produce from 'immer';

const experimentsBackendStatusUpdated = produce((draft, action) => {
  const { experimentId, backendStatus: { pipeline, gem2s } } = action.payload;

  draft[experimentId].meta.pipeline = {
    ...draft[experimentId].meta.pipeline || {},
    ...pipeline,
  };

  draft[experimentId].meta.gem2s = {
    ...draft[experimentId].meta.gem2s || {},
    ...gem2s,
  };
});

export default experimentsBackendStatusUpdated;
