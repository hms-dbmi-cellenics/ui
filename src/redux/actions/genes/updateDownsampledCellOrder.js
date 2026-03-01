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

  const cellOrder = getHeatmapCellOrder(
    selectedCellSet,
    groupedTracks,
    'All',
    hiddenCellSets,
    cellSetData,
  );

  // Update cellOrder atomically in a single dispatch
  // Prevents vitessce from seeing intermediate state where cellSets changed but cellOrder hasn't
  dispatch(updatePlotConfig(componentUuid, { cellOrder, isComputingCellOrder: false }));
};

export default updateDownsampledCellOrder;
