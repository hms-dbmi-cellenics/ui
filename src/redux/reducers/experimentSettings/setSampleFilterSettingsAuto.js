/* eslint-disable no-param-reassign */
import { produce, original } from 'immer';

const setSampleFilterSettingsAuto = produce((draft, action) => {
  const { step, sampleId, enabled } = action.payload;
  if (enabled) {
    draft.processing[step][sampleId] = original(draft.processing)[step].defaultFilterSettings;
  } else {
    draft.processing[step][sampleId].auto = enabled;
  }
});

export default setSampleFilterSettingsAuto;
