/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

import initialState from './initialState';

const loadedProcessingConfig = produce((draft, action) => {
  const { data } = action.payload;

  const originalProcessing = original(draft.processing);

  draft.processing = data;

  draft.processing.meta = {
    ...originalProcessing.meta,
    loading: false,
    loadingSettingsError: false,
    stepsDone: new Set(originalProcessing.meta.stepsDone),
  };
}, initialState);

export default loadedProcessingConfig;
