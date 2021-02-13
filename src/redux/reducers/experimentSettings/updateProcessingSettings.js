/* eslint-disable import/no-named-as-default-member */
import _ from 'lodash';
import initialState from './initialState';

const updateProcessingSettings = (state, action) => {
  const { settingName, configChange } = action.payload;

  const arrayMerge = (obj, src) => {
    if (_.isArray(obj)) {
      return src;
    }
  };

  const newConfig = _.cloneDeep(
    _.mergeWith(
      state.processing[settingName],
      configChange,
      arrayMerge,
    ),
  );

  return {
    ...initialState,
    ...state,
    processing: {
      ...initialState.processing,
      ...state.processing,
      [settingName]: {
        ...initialState.processing[settingName],
        ...newConfig,
      },
    },
  };
};

export default updateProcessingSettings;
