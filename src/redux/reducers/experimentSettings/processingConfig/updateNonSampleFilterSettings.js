import _ from 'lodash';
/* eslint-disable no-param-reassign */
import produce, { current } from 'immer';

import initialState from '../initialState';
import mergeObjectWithArrays from '../../../../utils/mergeObjectWithArrays';

const updateNonSampleFilterSettings = produce((draft, action) => {
  const { step, configChange, isALocalChange } = action.payload;

  if (!step) throw new Error(`Invalid step parameter received: ${step}`);

  const originalProcessingConfig = current(draft.processing)[step] ?? {};

  const newConfig = _.cloneDeep(originalProcessingConfig);

  mergeObjectWithArrays(
    newConfig,
    configChange,
  );

  draft.processing[step] = newConfig;

  if (!isALocalChange) {
    draft.originalProcessing[step] = newConfig;
  }
}, initialState);

export default updateNonSampleFilterSettings;
