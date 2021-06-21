/* eslint-disable import/no-named-as-default-member */
import _ from 'lodash';
import initialState from './initialState';

// Perform object destructuring to avoid picking extra properties if choosing the default values
const getDefaultValues = (state, settingName) => {
  const { auto, filterSettings } = state.processing[settingName];
  return { auto, filterSettings };
};

const updateSampleSettings = (state, action) => {
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
};

export default updateSampleSettings;
