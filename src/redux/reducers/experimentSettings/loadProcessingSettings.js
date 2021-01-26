import _ from 'lodash';
import initialState, { initialProcessingState } from './initialState';

const loadProcessingSettings = (state, action) => {
  const { data } = action.payload;

  const newConfig = _.cloneDeep(_.merge(
    initialProcessingState, state.processing, data,
  ));

  return {
    ...initialState,
    ...state,
    processing: {
      ...newConfig,
    },
  };
};

export default loadProcessingSettings;
