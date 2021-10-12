/* eslint-disable no-param-reassign */
import produce, { current } from 'immer';
import _ from 'lodash';

import initialState from '../initialState';

const loadedProcessingConfig = produce((draft, action) => {
  const { data } = action.payload;

  const newConfig = _.cloneDeep(data);

  const oldConfig = current(draft.processing);

  newConfig.meta = {
    ...oldConfig.meta,
    ...newConfig.meta,
    loading: false,
    loadingSettingsError: false,
    stepsDone: new Set(oldConfig.meta?.stepsDone ?? []),
  };

  const { meta, ...newConfigWithoutMeta } = newConfig;

  draft.originalProcessing = _.cloneDeep(newConfigWithoutMeta);

  draft.processing = newConfig;
}, initialState);

export default loadedProcessingConfig;
