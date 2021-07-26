/* eslint-disable no-param-reassign */
import produce, { current } from 'immer';
import _ from 'lodash';

import initialState from '../initialState';

const loadedProcessingConfig = produce((draft, action) => {
  const { data } = action.payload;

  const dataToSet = _.cloneDeep(data);

  const currentOriginalProcessing = current(draft.processing);

  dataToSet.meta = {
    ...currentOriginalProcessing.meta,
    ...data.meta,
    loading: false,
    loadingSettingsError: false,
    stepsDone: new Set(currentOriginalProcessing.meta?.stepsDone ?? []),
  };

  const { meta, ...dataToSetWithoutMeta } = dataToSet;

  draft.originalProcessing = _.cloneDeep(dataToSetWithoutMeta);

  draft.processing = dataToSet;
}, initialState);

export default loadedProcessingConfig;
