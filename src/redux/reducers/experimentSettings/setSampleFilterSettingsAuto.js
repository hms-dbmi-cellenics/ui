/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

const setSampleFilterSettingsAuto = produce((draft, action) => {
  const { step, sampleId, enabled } = action.payload;

  if (!draft.processing[step][sampleId]) {
    const defaultFilterSettings = original(draft.processing[step].filterSettings);
    draft.processing[step][sampleId] = defaultFilterSettings;
  }

  draft.processing[step][sampleId].auto = enabled;
});

export default setSampleFilterSettingsAuto;
