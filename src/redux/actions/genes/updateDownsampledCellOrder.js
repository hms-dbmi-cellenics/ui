import { DOWNSAMPLED_GENES_EXPRESSION_UPDATE_CELL_ORDER } from 'redux/actionTypes/genes';
import getHeatmapCellOrder from 'utils/work/getHeatmapCellOrder';

const updateDownsampledCellOrder = (componentUuid) => (dispatch, getState) => {
  const state = getState();

  const config = state.componentConfig[componentUuid]?.config;
  if (!config || !config.selectedCellSet || !config.groupedTracks) {
    return;
  }

  const { groupedTracks, selectedCellSet, selectedPoints } = config;
  const hiddenCellSets = Array.from(state.cellSets.hidden);
  const cellSetData = state.cellSets;

  // Recalculate cell order client-side
  const cellOrder = getHeatmapCellOrder(
    selectedCellSet,
    groupedTracks,
    selectedPoints,
    hiddenCellSets,
    cellSetData,
  );

  // Update Redux with new cell order
  dispatch({
    type: DOWNSAMPLED_GENES_EXPRESSION_UPDATE_CELL_ORDER,
    payload: {
      componentUuid,
      cellOrder,
    },
  });
};

export default updateDownsampledCellOrder;
