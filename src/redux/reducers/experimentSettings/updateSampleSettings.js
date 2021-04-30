/* eslint-disable import/no-named-as-default-member */
import _ from 'lodash';
import initialState from './initialState';

// Perform object destructuring to avoid picking extra properties if choosing the default values
const getDefaultValues = (state, settingName) => {
  const { auto, filterSettings } = state.processing[settingName];

  console.log('stateProcessingDebug');
  console.log(state.processing[settingName]);

  return { auto, filterSettings };
};

const updateSampleSettings = (state, action) => {
  const { settingName, sampleId, diff } = action.payload;

  const config = state.processing[settingName][sampleId] ?? getDefaultValues(state, settingName);

  const mergedSettings = _.merge(config, diff);

  const newState = {
    ...initialState,
    ...state,
    processing: {
      ...initialState.processing,
      ...state.processing,
      [settingName]: {
        ...state.processing[settingName],
        [sampleId]: mergedSettings,
      },
    },
  };

  return newState;
};

export default updateSampleSettings;
