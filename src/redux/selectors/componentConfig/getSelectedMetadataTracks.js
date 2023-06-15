import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

const getSelectedMetadataTracks = (plotUuid) => (state) => {
  if (!Object.keys(state.cellSets.properties)) return [];

  const selectedTracks = state.componentConfig[plotUuid]?.config.selectedTracks;
  if (!selectedTracks?.length) return [];

  const { properties } = state.cellSets;

  const existingSelectedTracks = selectedTracks
    ?.filter((track) => Object.keys(properties).includes(track)) || [];

  return existingSelectedTracks;
};

export default createMemoizedSelector(getSelectedMetadataTracks);
