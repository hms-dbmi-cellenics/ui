import _ from 'lodash';
import { initialViewState } from './getInitialState';

const genesPropertiesError = (state, action) => {
  const {
    componentUuid, error, properties,
  } = action.payload;

  return {
    ...state,
    properties: {
      ...state.properties,
      views: {
        ...state.properties.views,
        [componentUuid]: {
          ...initialViewState,
          ...state.properties.views[componentUuid],
          fetching: false,
          error,
        },
      },
      loading: _.difference(state.properties.loading, properties),
    },
  };
};

export default genesPropertiesError;
