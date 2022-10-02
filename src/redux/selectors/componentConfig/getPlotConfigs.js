import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

const getPlotConfigs = (plotUuids) => (state) => {
  if (!plotUuids) return {};

  const plotConfigsToReturn = plotUuids.reduce((acum, plotUuid) => {
    /* eslint-disable-next-line no-param-reassign */
    acum[plotUuid] = state[plotUuid]?.config;
    return acum;
  }, {});

  return plotConfigsToReturn;
};

export default createMemoizedSelector(getPlotConfigs);
