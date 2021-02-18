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
      meta: {
        ...newConfig.meta,
        stepsDone: new Set(newConfig.meta.stepsDone),
      },
      initialState: false,
    },
  };
};

export default loadProcessingSettings;
