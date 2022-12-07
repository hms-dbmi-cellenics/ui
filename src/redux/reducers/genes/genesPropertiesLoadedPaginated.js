import _ from 'lodash';
import { initialViewState } from './getInitialState';

const genesPropertiesLoadedPaginated = (state, action) => {
  const {
    properties, componentUuid, data, total,
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
          error: false,
          data: Object.keys(data),
          total,
        },
      },
      loading: _.difference(state.properties.loading, properties),
      data: { ...state.properties.data, ...data },
    },
  };
};

export default genesPropertiesLoadedPaginated;
