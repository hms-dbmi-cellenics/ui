/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';
import _ from 'lodash';

import initialState from './initialState';

// Perform object destructuring to avoid picking extra properties if choosing the default values
const getPreviousSettings = (draft, step, sampleId) => {
  const defaultFilterSettings = original(draft.processing[step].filterSettings);
  const previousSettings = original(draft.processing[step][sampleId]?.filterSettings);

  return previousSettings ?? defaultFilterSettings;
};

const updateSampleFilterSettings = produce((draft, action) => {
  const { step, sampleId, diff } = action.payload;

  const previousSettings = getPreviousSettings(draft, step, sampleId);

  const updatedSettings = _.clone(previousSettings);
  _.merge(updatedSettings, diff);

  draft.processing[step][sampleId].filterSettings = updatedSettings;
}, initialState);

/* // Perform object destructuring to avoid picking extra properties if choosing the default values
const getDefaultValues = (state, settingName) => {
  const { auto, filterSettings } = state.processing[settingName];
  return { auto, filterSettings };
};

const updateSampleFilterSettings = (state, action) => {
  const { step, sampleId, diff } = action.payload;

  const config = state.processing[step][sampleId] ?? getDefaultValues(state, step);

  const mergedSettings = _.merge(_.cloneDeep(config), diff);

  const newState = {
    ...initialState,
    ...state,
    processing: {
      ...initialState.processing,
      ...state.processing,
      [step]: {
        ...state.processing[step],
        [sampleId]: mergedSettings,
      },
    },
  };

  return newState;
}; */

export default updateSampleFilterSettings;
