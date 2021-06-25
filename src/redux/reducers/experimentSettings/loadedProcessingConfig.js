/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

import initialState from './initialState';

const loadedProcessingConfig = produce((draft, action) => {
  const { data } = action.payload;
  const originalProcessing = original(draft.processing);

  data.meta = {
    ...originalProcessing.meta,
    ...data.meta,
    loading: false,
    loadingSettingsError: false,
    stepsDone: new Set(originalProcessing.meta?.stepsDone ?? []),
  };

  draft.processing = data;
}, initialState);

export default loadedProcessingConfig;
