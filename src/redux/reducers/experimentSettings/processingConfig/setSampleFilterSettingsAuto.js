/* eslint-disable no-param-reassign */
import produce from 'immer';

const setSampleFilterSettingsAuto = produce((draft, action) => {
  const { step, sampleId, enabled } = action.payload;

  draft.processing[step][sampleId].auto = enabled;
});

export default setSampleFilterSettingsAuto;
