import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';
import getCellSets from '../cellSets/getCellSets';

const getGroupSlidesBy = (plotUuid) => (cellSets, componentConfig) => {
  if (!cellSets.accessible) return [];

  const groupSlidesBy = componentConfig[plotUuid]?.config.groupSlidesBy;
  if (!groupSlidesBy?.length) return [];

  const { properties } = cellSets;

  const existingSelectedTracks = groupSlidesBy
    ?.filter((track) => properties[track]) ?? [];

  return existingSelectedTracks;
};

export default createMemoizedSelector(
  getGroupSlidesBy,
  {
    inputSelectors: [
      (state) => getCellSets()(state.cellSets),
      (state) => state.componentConfig,
    ],
  },
);
