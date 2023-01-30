import _ from 'lodash';

const MAX_LEGEND_ITEMS = 50;

const generateLegendAlertHook = (hierarchy, cellSetKey, useConfigValue = true) => {
  const hookFn = (plotConfig) => {
    const cellSetName = useConfigValue ? plotConfig[cellSetKey] : cellSetKey;

    const numLegendItems = hierarchy.find(
      ({ key }) => key === cellSetName,
    )?.children?.length;

    if (numLegendItems < MAX_LEGEND_ITEMS) return plotConfig;

    const modifiedLegend = {
      enabled: false,
      showAlert: true,
    };

    if (!plotConfig.legend.enabled) modifiedLegend.showAlert = false;

    const modifiedConfig = _.merge({}, plotConfig, {
      legend: modifiedLegend,
    });

    return modifiedConfig;
  };

  return hookFn;
};

export default generateLegendAlertHook;
export { MAX_LEGEND_ITEMS };
