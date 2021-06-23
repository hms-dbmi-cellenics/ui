/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

import initialState from './initialState';
import mergeObjectWithArrays from '../../../utils/mergeObjectWithArrays';

const updateProcessingSettings = produce((draft, action) => {
  const { step, configChange } = action.payload;

  const originalProcessingConfig = original(draft.processing)[step] ?? {};

  const newConfig = mergeObjectWithArrays(
    originalProcessingConfig,
    configChange,
  );

  draft.processing[step] = newConfig;
}, initialState);

export default updateProcessingSettings;
