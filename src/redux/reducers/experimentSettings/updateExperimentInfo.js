/* eslint-disable no-param-reassign */
import produce from 'immer';

const updateExperimentInfo = produce((draft, action) => {
  const {
    experimentId,
    experimentName,
    projectId,
  } = action.payload;

  draft.info.experimentId = experimentId;
  draft.info.experimentName = experimentName;
  draft.info.projectUuid = projectId;
});

export default updateExperimentInfo;
