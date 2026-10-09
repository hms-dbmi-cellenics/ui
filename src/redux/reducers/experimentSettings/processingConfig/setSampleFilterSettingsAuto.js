/* eslint-disable no-param-reassign */
import produce, { current } from 'immer';

import initialState from '../initialState';

const setSampleFilterSettingsAuto = produce((draft, action) => {
  const { step, sampleId, isAuto } = action.payload;

  draft.processing[step][sampleId].auto = isAuto;

  if (isAuto) {
    const { filterSettings, defaultFilterSettings } = current(draft.processing[step][sampleId]);

    // filters with several methods keep the chosen method in automatic mode and
    // take that method's default settings
    const keepMethod = filterSettings?.method
      && defaultFilterSettings?.methodSettings?.[filterSettings.method];

    draft.processing[step][sampleId].filterSettings = keepMethod
      ? { ...defaultFilterSettings, method: filterSettings.method }
      : defaultFilterSettings;
  }
}, initialState);

export default setSampleFilterSettingsAuto;
