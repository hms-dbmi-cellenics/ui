import initialState from './initialState';

import mergeObjectWithArrays from '../../../utils/mergeObjectWithArrays';

const backendStatusLoaded = (state, action) => {
  const { status } = action.payload;

  const newStatus = mergeObjectWithArrays(state.backendStatus.status ?? {}, status);

  return {
    ...initialState,
    ...state,
    backendStatus: {
      newStatus,
      loading: false,
      error: false,
    },
  };
};

export default backendStatusLoaded;
