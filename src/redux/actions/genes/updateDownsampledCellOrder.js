import updatePlotConfig from 'redux/actions/componentConfig/updatePlotConfig';
import getHeatmapCellOrder from 'utils/work/getHeatmapCellOrder';

const updateDownsampledCellOrder = (componentUuid, selectedPoints = null) => (
  dispatch,
  getState,
) => {
  const state = getState();

  const config = state.componentConfig[componentUuid]?.config;
  if (!config || !config.selectedCellSet || !config.groupedTracks) {
    return;
  }

  const { groupedTracks, selectedCellSet } = config;
  let hiddenCellSets = Array.from(state.cellSets.hidden);
  const cellSetData = state.cellSets;

  // Compute which cell sets should be hidden based on selectedPoints
  // This is done locally without updating Redux to avoid triggering extra effects
  if (selectedPoints && selectedPoints !== 'All') {
    const parts = selectedPoints.split('/');
    if (parts.length === 2) {
      const [categoryKey, selectedCellSetKey] = parts;
      const categoryRoot = cellSetData.hierarchy.find(
        (node) => node.key === categoryKey,
      );

      if (categoryRoot?.children) {
        categoryRoot.children.forEach((child) => {
          if (child.key !== selectedCellSetKey) {
            if (!hiddenCellSets.includes(child.key)) {
              hiddenCellSets.push(child.key);
            }
          } else {
            // Include the selected cell set even if it was manually hidden
            hiddenCellSets = hiddenCellSets.filter(
              (key) => key !== child.key,
            );
          }
        });
      }
    }
  }

  // Defer expensive cellOrder computation to unblock UI
  setTimeout(() => {
    const cellOrder = getHeatmapCellOrder(
      selectedCellSet,
      groupedTracks,
      'All',
      hiddenCellSets,
      cellSetData,
    );

    // Update config with new cellOrder atomically
    dispatch(updatePlotConfig(componentUuid, { cellOrder }));
  }, 0);
};

export default updateDownsampledCellOrder;
