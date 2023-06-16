import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';
import getCellSets from '../cellSets/getCellSets';

const getSelectedMetadataTracks = (plotUuid) => (state) => {
  if (!state.accessible) return [];

  const selectedTracks = state.componentConfig[plotUuid]?.config.selectedTracks;
  if (!selectedTracks?.length) return [];

  const { properties } = state.cellSets;

  const existingSelectedTracks = selectedTracks
    ?.filter((track) => properties[track]) ?? [];

  return existingSelectedTracks;
};

export default createMemoizedSelector(
  getSelectedMetadataTracks,
  { inputSelectors: getCellSets() },
);
