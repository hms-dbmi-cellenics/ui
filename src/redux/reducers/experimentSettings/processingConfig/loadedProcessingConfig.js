/* eslint-disable no-param-reassign */
import produce, { current } from 'immer';
import _ from 'lodash';

import initialState from '../initialState';

// Will be removed once the default values are stored in the pipeline
const withAutomaticSettings = (processingConfig) => {
  const processingConfigWithAuto = _.cloneDeep(processingConfig);

  // adding default config to every filter with auto option
  Object.keys(processingConfig).forEach((step) => {
    const currentStepSettings = processingConfig[step];
    const sampleId = Object.keys(currentStepSettings).find(
      (currentSample) => currentStepSettings[currentSample].auto,
    );

    if (sampleId) {
      processingConfigWithAuto[step][sampleId]
        .defaultFilterSettings = processingConfig[step][sampleId].filterSettings;
    }
  });

  return processingConfigWithAuto;
};

const loadedProcessingConfig = produce((draft, action) => {
  const { data, fromGem2s } = action.payload;

  const originalProcessing = current(draft.processing);

  draft.originalProcessing = data;

  let dataToSet = _.cloneDeep(data);

  dataToSet.meta = {
    ...originalProcessing.meta,
    ...data.meta,
    loading: false,
    loadingSettingsError: false,
    stepsDone: new Set(originalProcessing.meta?.stepsDone ?? []),
  };

  if (fromGem2s) {
    dataToSet = withAutomaticSettings(dataToSet);
  }

  draft.processing = dataToSet;
}, initialState);

export default loadedProcessingConfig;
