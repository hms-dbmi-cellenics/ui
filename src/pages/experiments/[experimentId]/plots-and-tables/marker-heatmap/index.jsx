import React, { useEffect, useState } from 'react';
import {
  Row, Col, Space, Collapse, Skeleton, Empty, Typography,
} from 'antd';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';
import loadProcessingSettings from '../../../../../redux/actions/experimentSettings/processingConfig/loadProcessingSettings';
import PlotStyling from '../../../../../components/plots/styling/PlotStyling';
import { updatePlotConfig, loadPlotConfig } from '../../../../../redux/actions/componentConfig';
import Header from '../../../../../components/plots/Header';
import { generateSpec } from '../../../../../utils/plotSpecs/generateHeatmapSpec';
import { loadGeneExpression, loadMarkerGenes } from '../../../../../redux/actions/genes';
import { loadCellSets } from '../../../../../redux/actions/cellSets';
import PlatformError from '../../../../../components/PlatformError';
import Loader from '../../../../../components/Loader';
import populateHeatmapData from '../../../../../components/plots/helpers/populateHeatmapData';
import HeatmapControls from '../../../../../components/plots/styling/heatmap/HeatmapControls';

const { Text } = Typography;
const { Panel } = Collapse;

const plotUuid = 'markerHeatmapPlotMain';
const plotType = 'markerHeatmap';

const route = {
  path: 'marker-heatmap',
  breadcrumbName: 'Marker-Heatmap',
};
const MarkerHeatmap = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);

  const { expression: expressionData } = useSelector((state) => state.genes);
  const { error, loading } = expressionData;
  const cellSets = useSelector((state) => state.cellSets);
  const { hierarchy, properties } = cellSets;
  const selectedGenes = useSelector((state) => state.genes.expression.views[plotUuid]?.data) || [];
  const {
    loading: loadingMarkerGenes,
    error: errorMarkerGenes,
  } = useSelector((state) => state.genes.markers);
  const [vegaSpec, setVegaSpec] = useState();
  const louvainClustersResolution = useSelector(
    (state) => state.experimentSettings.processing
      .configureEmbedding?.clusteringSettings.methodSettings.louvain.resolution,
  ) || false;

  useEffect(() => {
    if (!louvainClustersResolution) {
      dispatch(loadProcessingSettings(experimentId));
    }
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    if (!cellSets?.hierarchy?.length) {
      dispatch(loadCellSets(experimentId));
    }
  }, []);

  useEffect(() => {
    if (louvainClustersResolution && config) {
      dispatch(loadMarkerGenes(
        experimentId, louvainClustersResolution, plotUuid, config.numGenes, config.selectedCellSet,
      ));
    }
  }, [louvainClustersResolution, config?.selectedCellSet, config?.numGenes]);

  useEffect(() => {
    if (!config) {
      return;
    }
    // grouping and metadata tracks should change when data is changed
    updatePlotWithChanges(
      { selectedTracks: [config.selectedCellSet], groupedTracks: [config.selectedCellSet] },
    );
  }, [config?.selectedCellSet]);

  const sortGenes = (newGenes) => {
    const clusters = hierarchy.find((cluster) => cluster.key === config.selectedCellSet).children;

    const getCellIdsForCluster = (clusterId) => properties[clusterId].cellIds;

    const getAverageExpressionForGene = (gene, currentCellIds) => {
      const expressionValues = expressionData.data[gene].rawExpression.expression;
      let totalValue = 0;
      currentCellIds.forEach((cellId) => {
        totalValue += expressionValues[cellId];
      });
      return totalValue / currentCellIds.size;
    };

    const getClusterForGene = (gene) => {
      const maxAverageExpression = { expression: 0, clusterId: -1 };

      clusters.forEach((cluster, clusterIndx) => {
        const currentCellIds = getCellIdsForCluster(cluster.key);
        const currentAverageExpression = getAverageExpressionForGene(gene, currentCellIds);
        if (currentAverageExpression > maxAverageExpression.expression) {
          maxAverageExpression.expression = currentAverageExpression;
          maxAverageExpression.clusterId = clusterIndx;
        }
      });
      return maxAverageExpression.clusterId;
    };

    const newOrder = _.cloneDeep(config.selectedGenes);

    newGenes.forEach((gene) => {
      const clusterIndx = getClusterForGene(gene);
      newOrder.forEach((oldGene) => {
        if (!_.includes(newOrder, gene)) {
          const currentClusterIndx = getClusterForGene(oldGene);
          if (currentClusterIndx === clusterIndx) {
            const geneIndex = newOrder.indexOf(oldGene);
            newOrder.splice(geneIndex, 0, gene);
          }
        }
      });
    });
    return newOrder;
  };
  useEffect(() => {
    if (!config || _.isEmpty(expressionData)) {
      return;
    }
    if (selectedGenes.length && !config.selectedGenes.length) {
      updatePlotWithChanges({ selectedGenes });
      return;
    }
    if (selectedGenes.length !== config.selectedGenes.length) {
      const newGenes = _.difference(selectedGenes, config.selectedGenes);
      let newOrder;
      if (!newGenes.length) {
        // gene was removed instead of added - no need to sort
        const removedGenes = _.difference(config.selectedGenes, selectedGenes);
        newOrder = _.cloneDeep(config.selectedGenes);
        newOrder = newOrder.filter((gene) => !removedGenes.includes(gene));
      } else {
        newOrder = sortGenes(newGenes);
      }
      updatePlotWithChanges({ selectedGenes: newOrder });
    }
  }, [selectedGenes, config?.selectedGenes]);
  useEffect(() => {
    if (cellSets.loading
      || _.isEmpty(expressionData)
      || _.isEmpty(selectedGenes)
      || !loading
      || !hierarchy?.length
    ) {
      return;
    }
    const spec = generateSpec(config, 'Cluster ID', plotUuid);
    const data = populateHeatmapData(cellSets, config, expressionData, config.selectedGenes, true);
    const newVegaSpec = {
      ...spec,
      axes: [...spec.axes, ...displayLabels()],
      data: spec.data.map((datum) => ({
        ...datum,
        values: data[datum.name],
      })),
    };
    setVegaSpec(newVegaSpec);
  }, [config, cellSets]);

  const displayLabels = () => {
    // if there are more than 53 genes - do not display the labels axe
    const labels = [
      {
        domain: false,
        orient: 'left',
        scale: 'y',
      },
    ];
    if (config.showGeneLabels) {
      return labels;
    }
    return [];
  };

  // updatedField is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (updatedField) => {
    dispatch(updatePlotConfig(plotUuid, updatedField));
  };

  const onGeneEnter = (genes) => {
    dispatch(loadGeneExpression(experimentId, genes, plotUuid));
  };

  const renderPlot = () => {
    if (!config
      || loading.length > 0
      || cellSets.loading
      || loadingMarkerGenes
      || !config.selectedGenes.length) {
      return (<Loader experimentId={experimentId} />);
    }

    if (error) {
      return (
        <PlatformError
          description='Could not load gene expression data.'
          error={error}
          onClick={() => dispatch(loadGeneExpression(experimentId, config.selectedGenes, plotUuid))}
        />
      );
    }
    if (errorMarkerGenes) {
      return (
        <PlatformError
          description='Could not load marker genes.'
          error={errorMarkerGenes}
          onClick={
            () => dispatch(
              loadMarkerGenes(experimentId, louvainClustersResolution, plotUuid, config.numGenes),
            )
          }
        />
      );
    }
    if (selectedGenes.length === 0) {
      return (
        <Empty description={(
          <Text>Add some genes to this heatmap to get started.</Text>
        )}
        />
      );
    }
    if (vegaSpec) {
      return <Vega spec={vegaSpec} renderer='canvas' />;
    }
  };
  const onReset = () => {
    onGeneEnter([]);
    dispatch(loadMarkerGenes(experimentId, louvainClustersResolution, plotUuid, config.numGenes));
  };

  const plotStylingControlsConfig = [
    {
      panelTitle: 'Expression Values',
      controls: ['expressionValuesType', 'expressionValuesCapping'],
    },
    {
      panelTitle: 'Main Schema',
      controls: ['dimensions'],
      children: [
        {
          panelTitle: 'Title',
          controls: ['title'],
        },
        {
          panelTitle: 'Font',
          controls: ['font'],
        },
      ],
    },
    {
      panelTitle: 'Colours',
      controls: ['colourScheme'],
    },
    {
      panelTitle: 'Legend',
      controls: [
        {
          name: 'legend',
          props: {
            option: {
              positions: 'horizontal-vertical',
            },
          },
        },
      ],
    },
  ];

  if (!config || cellSets.loading || !hierarchy) {
    return (<Skeleton />);
  }

  return (
    <div style={{ paddingLeft: 32, paddingRight: 32 }}>
      <Header plotUuid={plotUuid} experimentId={experimentId} finalRoute={route} />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Preview' key='1'>
                <center>
                  {renderPlot() }
                </center>
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <HeatmapControls
              selectedGenes={config.selectedGenes}
              onUpdate={updatePlotWithChanges}
              config={config}
              plotUuid={plotUuid}
              markerHeatmap
              onGeneEnter={onGeneEnter}
              cellSets={cellSets}
              onReset={onReset}
            />
            <PlotStyling formConfig={plotStylingControlsConfig} config={config} onUpdate={updatePlotWithChanges} defaultActiveKey={['5']} />
          </Space>
        </Col>
      </Row>
    </div>
  );
};

MarkerHeatmap.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default MarkerHeatmap;
