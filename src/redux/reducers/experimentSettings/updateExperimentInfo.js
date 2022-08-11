/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState, { metaInitialState } from './initialState';

const updateExperimentInfo = produce((draft, action) => {
  const {
    experimentId,
    experimentName,
    sampleIds,
    qcRerunDisabled,
  } = action.payload;

  draft.info.experimentId = experimentId;
  draft.info.experimentName = experimentName;
  draft.info.sampleIds = sampleIds;
  draft.info.qcRerunDisabled = qcRerunDisabled;

  // Experiment id was updated so processing config requires reloading
  draft.processing = { meta: metaInitialState };
}, initialState);

export default updateExperimentInfo;
