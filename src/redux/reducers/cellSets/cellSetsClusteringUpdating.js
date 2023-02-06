/* eslint-disable no-param-reassign */
import produce from 'immer';

const cellSetsClusteringUpdating = produce((draft) => {
  draft.updatingCellSets = true;
  draft.loading = true;
});

export default cellSetsClusteringUpdating;
