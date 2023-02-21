/* eslint-disable no-param-reassign */
import produce from 'immer';

const experimentsLoaded = produce((draft, action) => {
  const { experiments } = action.payload;
  draft.meta.exampleExperiments = experiments;
  draft.meta.loading = false;
});

export default experimentsLoaded;
