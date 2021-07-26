/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from '../initialState';

const processingSettingsError = produce((draft, action) => {
  const { error, errorType } = action.payload;

  draft.processing.meta.loading = false;
  draft.processing.meta[errorType] = error;
}, initialState);

export default processingSettingsError;
