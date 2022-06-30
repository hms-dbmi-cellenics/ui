/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

import _ from 'lodash';

const experimentsLoaded = produce((draft, action) => {
  const { experiments } = action.payload;

  const originalState = original(draft);

  let newActiveExperimentId = originalState.meta.activeExperimentId;

  // If the current active experiment no longer exists, change it
  if (!Object.keys(originalState).includes(newActiveExperimentId)) {
    newActiveExperimentId = experiments[0]?.id;
  }

  const ids = _.map(experiments, 'id');

  draft.meta.activeExperimentId = experiments[0].id;
  draft.meta.loading = false;
  draft.ids = ids;

  experiments.forEach((experiment) => {
    experiment.sampleIds = experiment.samplesOrder;

    draft[experiment.id] = _.omit(experiment, ['samplesOrder']);
  });
});

export default experimentsLoaded;
