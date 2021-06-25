import _ from 'lodash';
/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

import initialState from './initialState';
import mergeObjectWithArrays from '../../../utils/mergeObjectWithArrays';

const updateProcessingSettings = produce((draft, action) => {
  const { step, configChange } = action.payload;

  if (!step) throw new Error('Invalid step value');

  const originalProcessingConfig = original(draft.processing)[step] ?? {};

  const newConfig = _.cloneDeep(originalProcessingConfig);

  mergeObjectWithArrays(
    newConfig,
    configChange,
  );

  draft.processing[step] = newConfig;
}, initialState);

export default updateProcessingSettings;
