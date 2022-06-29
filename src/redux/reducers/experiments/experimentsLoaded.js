/* eslint-disable no-param-reassign */
import produce from 'immer';

const experimentsLoaded = produce((draft, action) => {
  const { experiments } = action.payload;

  console.log('experimentsDebug');
  console.log(experiments);

  // const newActiveExperimentId = state.meta.activeExperimentId;

  // // If the current active experiment no longer exists, change it
  // if (!Object.keys(state).includes(newActiveExperimentId)) {
  //   newActiveExperimentId = experiments[0]?.id;
  // }
  draft.meta.activeExperimentId = experiments[0].id;
  draft.meta.loading = false;

  experiments.forEach((experiment) => {
    // WIP, deal with this before emrging
    experiment.sampleIds = experiment.samplesOrder;

    draft[experiment.id] = experiment;
  });
});

export default experimentsLoaded;
