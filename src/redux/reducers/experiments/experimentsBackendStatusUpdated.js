/* eslint-disable no-param-reassign */
import produce from 'immer';

const experimentsBackendStatusUpdated = produce((draft, action) => {
  const { experimentId, backendStatus: { pipeline, gem2s } } = action.payload;

  draft[experimentId].meta.pipeline.startDate = pipeline.startDate;
  draft[experimentId].meta.pipeline.stopDate = pipeline.stopDate;
  draft[experimentId].meta.pipeline.status = pipeline.status;
  draft[experimentId].meta.pipeline.stepsCompleted = pipeline.stepsCompleted;

  draft[experimentId].meta.gem2s.startDate = gem2s.startDate;
  draft[experimentId].meta.gem2s.stopDate = gem2s.stopDate;
  draft[experimentId].meta.gem2s.status = gem2s.status;
  draft[experimentId].meta.gem2s.stepsCompleted = gem2s.stepsCompleted;
});

export default experimentsBackendStatusUpdated;
