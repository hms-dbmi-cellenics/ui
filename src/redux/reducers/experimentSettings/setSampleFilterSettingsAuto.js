/* eslint-disable no-param-reassign */
import { produce, original } from 'immer';

const setSampleFilterSettingsAuto = produce((draft, action) => {
  const { step, sampleId, isAuto } = action.payload;
  if (isAuto) {
    draft.processing[step][sampleId] = original(draft.processing)[step].defaultFilterSettings;
  } else {
    draft.processing[step][sampleId].auto = isAuto;
  }
});

export default setSampleFilterSettingsAuto;
