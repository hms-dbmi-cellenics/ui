const populateFrequencyData = (spec, hierarchy, properties, config) => {
  const calculateSum = (proportionClusters, xAxisClustersIds) => {
    let sum = 0;

    if (!xAxisClustersIds.length) {
      proportionClusters.forEach((cellSetCluster) => {
        sum += properties[cellSetCluster.key].cellIds.size;
      });
      return sum;
    }
    proportionClusters.forEach((cellSetCluster) => {
      const cellSetIds = Array.from(properties[cellSetCluster.key].cellIds);
      sum += xAxisClustersIds.filter((id) => cellSetIds.includes(id)).length;
    });
    return sum;
  };

  const getClustersForGrouping = (name) => hierarchy.filter((cluster) => (
    cluster.key === name))[0]?.children;

  const populateData = (x, y, cluster, sum, data) => {
    let value = y;
    if (config.frequencyType === 'proportional') {
      value = (y / sum) * 100;
    }

    data.push({
      x,
      y: value,
      c: cluster.name,
      color: cluster.color,
    });

    return data;
  };

  let data = [];

  const proportionClusters = hierarchy.filter((cluster) => (
    cluster.key === config.proportionGrouping))[0]?.children;

  if (!proportionClusters) {
    return [];
  }

  const clustersInXAxis = getClustersForGrouping(config.xAxisGrouping);
  if (!clustersInXAxis) {
    const sum = calculateSum(proportionClusters, []);
    proportionClusters.forEach((clusterName) => {
      const x = 1;
      const y = properties[clusterName.key].cellIds.size;
      const cluster = properties[clusterName.key];
      data = populateData(x, y, cluster, sum, data);
    });
  } else {
    clustersInXAxis.forEach((clusterInXAxis) => {
      const clusterInXAxisIds = Array.from(properties[clusterInXAxis.key].cellIds);

      const sum = calculateSum(proportionClusters, clusterInXAxisIds);

      proportionClusters.forEach((clusterName) => {
        const x = properties[clusterInXAxis.key].name;
        const cellSetIds = Array.from(properties[clusterName.key].cellIds);
        const y = clusterInXAxisIds.filter((id) => cellSetIds.includes(id)).length;
        const cluster = properties[clusterName.key];

        if (y !== 0) {
          data = populateData(x, y, cluster, sum, data);
        }
      });
    });
  }

  spec.data.forEach((datum) => {
    datum.values = data; // eslint-disable-line no-param-reassign
  });
  return data;
};

export default populateFrequencyData;
