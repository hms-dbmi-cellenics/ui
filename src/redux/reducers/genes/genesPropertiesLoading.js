import _ from 'lodash';
import { initialViewState } from './getInitialState';

const genesPropertiesLoading = (state, action) => {
  const { properties, componentUuid } = action.payload;

  return {
    ...state,
    properties: {
      ...state.properties,
      views: {
        ...state.properties.views,
        [componentUuid]: {
          ...initialViewState,
          ...state.properties.views[componentUuid],
          fetching: true,
          error: false,
          data: [],
        },
      },
      loading: _.union(state.properties.loading, properties),
    },
  };
};

export default genesPropertiesLoading;
