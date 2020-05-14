/* eslint-disable no-param-reassign */
import { combineReducers } from 'redux';
import { FETCH_CELL_SETS } from '../actions/actionType';

const cellSetsReducer = (state = {}, action) => {
  switch (action.type) {
    case FETCH_CELL_SETS:
      // fetching Cell Set

      // eslint-disable-next-line no-case-declarations
      const response = {
        cellSets: [
          {
            key: 1,
            name: 'Cell types',
            rootNode: true,
            children: [
              { key: 7, name: 'Hepatocytes', color: '#008DA6' },
              { key: 3, name: 'B cells', color: '#AB149E' },
              { key: 4, name: 'Kupffer cells', color: '#F44E3B' },
              {
                key: 5,
                name: 'Stellate cells and myofibroblasts',
                color: '#FCDC00',
              },
              {
                key: 6,
                name: 'Liver sinusoidal endothelial cells',
                color: '#68BC00',
              },
            ],
          },
          {
            key: 2,
            name: 'Louvain clusters',
            rootNode: true,
            children: [
              { key: 8, name: 'Cluster 1', color: '#CCCCCC' },
              { key: 9, name: 'Cluster 2', color: '#9F0500' },
              { key: 10, name: 'Cluster 3', color: '#C45100' },
            ],
          },
          { key: 15, name: 'My Custom Set', rootNode: true },
          {
            key: 11,
            name: 'k-Means clusters',
            rootNode: true,
            children: [
              { key: 12, name: 'Cluster 1', color: '#CCCCCC' },
              { key: 13, name: 'Cluster 2', color: '#9F0500' },
              { key: 14, name: 'Cluster 3', color: '#C45100' },
            ],
          },
        ],
      };

      state.data = response.cellSets;
      return state;
    default:
      return state;
  }
};

export default combineReducers({
  cellSets: cellSetsReducer,
});
