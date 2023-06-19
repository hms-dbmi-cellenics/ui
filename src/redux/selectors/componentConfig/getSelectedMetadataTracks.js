import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';
import getCellSets from '../cellSets/getCellSets';

const getSelectedMetadataTracks = (plotUuid) => (cellSets, componentConfig) => {
  if (!cellSets.accessible) return [];

  const selectedTracks = componentConfig[plotUuid]?.config.selectedTracks;
  if (!selectedTracks?.length) return [];

  const { properties } = cellSets;

  const existingSelectedTracks = selectedTracks
    ?.filter((track) => properties[track]) ?? [];

  return existingSelectedTracks;
};

export default createMemoizedSelector(
  getSelectedMetadataTracks,
  {
    inputSelectors: [
      (state) => getCellSets()(state.cellSets),
      (state) => state.componentConfig,
    ],
  },
);
