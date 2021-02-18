import _ from 'lodash';
import initialState from './initialState';

const loadProcessingSettings = (state, action) => {
  const { data } = action.payload;

  const newConfig = _.cloneDeep(_.merge(
    initialState.processing, state.processing, data,
  ));

  return {
    ...initialState,
    ...state,
    processing: {
      ...newConfig,
      processingConfig: {
        ...newConfig.processingConfig,
        stepsDone: new Set(newConfig.processingConfig.stepsDone),
      },
    },
  };
};

export default loadProcessingSettings;
