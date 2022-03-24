/* eslint-disable no-param-reassign */
import produce, { current } from 'immer';

import initialState from '../initialState';

const processingSettingsSaved = produce((draft, action) => {
  const { settingName } = action.payload;

  console.log('+++++++++++ ', draft.originalProcessing, ' ------ ', draft.processing, ' ---- ', settingName);
  draft.originalProcessing[settingName] = current(draft.processing[settingName]);
}, initialState);

export default processingSettingsSaved;
