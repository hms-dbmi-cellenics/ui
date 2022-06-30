import React, { useEffect, useState } from 'react';
import {
  Space,
  Collapse,
  Skeleton,
  Empty,
  Select,
  Radio,
  Tabs,
} from 'antd';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';

import { getCellSets, getCellSetsHierarchyByKeys, getCellSetsHierarchyByType } from 'redux/selectors';
import getSelectOptions from 'utils/plots/getSelectOptions';

import HeatmapGroupBySettings from 'components/data-exploration/heatmap/HeatmapGroupBySettings';
import HeatmapMetadataTracksSettings from 'components/data-exploration/heatmap/HeatmapMetadataTrackSettings';

import MarkerGeneSelection from 'components/plots/styling/MarkerGeneSelection';
import loadProcessingSettings from 'redux/actions/experimentSettings/processingConfig/loadProcessingSettings';
import { updatePlotConfig, loadPlotConfig } from 'redux/actions/componentConfig';
import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import { generateSpec } from 'utils/plotSpecs/generateHeatmapSpec';
import { loadGeneExpression, loadMarkerGenes } from 'redux/actions/genes';
import { loadCellSets } from 'redux/actions/cellSets';
import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';
import populateHeatmapData from 'components/plots/helpers/heatmap/populateHeatmapData';
import { plotNames } from 'utils/constants';

import GeneReorderTool from 'components/plots/GeneReorderTool';
import GeneSearchBar from 'components/plots/GeneSearchBar';
import { loadPaginatedGeneProperties } from 'redux/actions/genes';

const { Panel } = Collapse;
const plotUuid = 'markerHeatmapPlotMain';
const plotType = 'markerHeatmap';
const searchBarUuid = 'geneSearchBar';
const { TabPane } = Tabs;

const MarkerHeatmap = ({ experimentId }) => {
  const dispatch = useDispatch();

  const [vegaSpec, setVegaSpec] = useState();

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);

  const { expression: expressionData } = useSelector((state) => state.genes);
  const { error, loading } = expressionData;

  const cellSets = useSelector(getCellSets());
  const { hierarchy, properties } = cellSets;

  const cellOptions = useSelector(getCellSetsHierarchyByType('cellSets'));

  const selectedCellSetClassAvailable = useSelector(
    getCellSetsHierarchyByKeys([config?.selectedCellSet]),
  ).length;

  const loadedMarkerGenes = useSelector(
    (state) => state.genes.expression.views[plotUuid]?.data,
  ) || [];

  const {
    loading: loadingMarkerGenes,
    error: errorMarkerGenes,
  } = useSelector((state) => state.genes.markers);

  const louvainClustersResolution = useSelector(
    (state) => state.experimentSettings.processing
      .configureEmbedding?.clusteringSettings.methodSettings.louvain.resolution,
  ) || false;

  useEffect(() => {
    if (!louvainClustersResolution) dispatch(loadProcessingSettings(experimentId));
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    if (!hierarchy?.length) dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (louvainClustersResolution && config?.nMarkerGenes && hierarchy?.length) {
      if (selectedCellSetClassAvailable) {
        dispatch(loadMarkerGenes(
          experimentId, louvainClustersResolution,
          plotUuid, config.nMarkerGenes, config.selectedCellSet,
        ));
      } else {
        pushNotificationMessage('error', endUserMessages.NO_CLUSTERS);
      }
    }
  }, [config?.selectedCellSet, config?.nMarkerGenes, hierarchy]);

  useEffect(() => {
    if (louvainClustersResolution
      && config && hierarchy?.length) {
      dispatch(loadMarkerGenes(
        experimentId,
        louvainClustersResolution,
        plotUuid,
        config.nMarkerGenes,
        config.selectedCellSet,
      ));
    }
  }, [louvainClustersResolution]);

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

  const reSortGenes = () => {
    const newGenes = _.difference(loadedMarkerGenes, config.selectedGenes);
    let newOrder;

    if (!newGenes.length) {
      // gene was removed instead of added - no need to sort
      const removedGenes = _.difference(config.selectedGenes, loadedMarkerGenes);
      newOrder = _.cloneDeep(config.selectedGenes);
      newOrder = newOrder.filter((gene) => !removedGenes.includes(gene));
    } else if (newGenes.length === 1) {
      // single gene difference - added manually by user
      newOrder = sortGenes(newGenes);
    } else {
      // selected data was changed
      newOrder = loadedMarkerGenes;
    }

    return newOrder;
  };

  useEffect(() => {
    if (!config || _.isEmpty(expressionData)) {
      return;
    }
    if (loadedMarkerGenes.length && !config.selectedGenes.length) {
      updatePlotWithChanges({ selectedGenes: loadedMarkerGenes });
      return;
    }

    if (loadedMarkerGenes.length !== config.selectedGenes.length) {
      const newOrder = reSortGenes();
      updatePlotWithChanges({ selectedGenes: newOrder });
    }
  }, [loadedMarkerGenes, config?.selectedGenes]);

  useEffect(() => {
    if (cellSets.loading
      || _.isEmpty(expressionData)
      || _.isEmpty(loadedMarkerGenes)
      || !loading
      || !hierarchy?.length
    ) {
      return;
    }

    const data = populateHeatmapData(cellSets, config, expressionData, config.selectedGenes, true);
    const spec = generateSpec(config, 'Cluster ID', data, true);

    spec.description = 'Marker heatmap';

    const extraMarks = {
      type: 'rule',
      from: { data: 'clusterSeparationLines' },
      encode: {
        enter: {
          stroke: { value: 'white' },
        },
        update: {
          x: { scale: 'x', field: 'data' },
          y: 0,
          y2: { field: { group: 'height' } },
          strokeWidth: { value: 1 },
          strokeOpacity: { value: 1 },
        },
      },
    };
    spec.marks.push(extraMarks);

    setVegaSpec(spec);
  }, [config, cellSets]);

  useEffect(() => {
    const state = {
      sorter: {
        field: 'gene_names',
        columnKey: 'gene_names',
        order: 'ascend',
      },
      pagination: {
        current: 1,
        pageSize: 100000,
      },
      pageSizeFilter: null,
    };

    dispatch(loadPaginatedGeneProperties(experimentId, ['dispersions'], searchBarUuid, state));
  }, []);

  // updatedField is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (updatedField) => {
    dispatch(updatePlotConfig(plotUuid, updatedField));
  };

  const plotStylingConfig = [
    {
      panelTitle: 'Expression values',
      controls: ['expressionValuesType', 'expressionValuesCapping'],
    },
    {
      panelTitle: 'Main schema',
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
  const onGeneEnter = (genes) => {
    dispatch(loadGeneExpression(experimentId, genes, plotUuid));
  };

  const onReset = () => {
    onGeneEnter([]);
    dispatch(loadMarkerGenes(
      experimentId,
      louvainClustersResolution,
      plotUuid,
      config.nMarkerGenes,
      config.selectedCellSet,
    ));
  };

  if (!config || cellSets.loading || hierarchy.length === 0) {
    return (<Skeleton />);
  }

  const clustersForSelect = getSelectOptions(cellOptions);

  const changeClusters = (option) => {
    const newValue = option.value.toLowerCase();
    updatePlotWithChanges({ selectedCellSet: newValue });
  };

  const renderExtraPanels = () => (
    <>
      <Panel header='Gene selection' key='gene-selection'>
        <Tabs defaultActiveKey='1'>
          <TabPane tab='Add/Remove genes' key='1'>
            <MarkerGeneSelection
              config={config}
              onUpdate={updatePlotWithChanges}
              onGeneEnter={onGeneEnter}
              onReset={onReset}
            />
            <div>
              <p>Gene labels:</p>
              <Radio.Group
                onChange={
                  (e) => updatePlotWithChanges({ showGeneLabels: e.target.value })
                }
                value={config.showGeneLabels}
              >
                <Radio value>Show</Radio>
                <Radio value={false}>Hide</Radio>
              </Radio.Group>
            </div>
          </TabPane>
          <TabPane tab='Re-order genes' key='2'>
            <p>Type in a gene name and select it or hit enter to add it to the heatmap. Drag and drop genes to re-order them.</p>
            {/* space needed to separate search box and reorder tree, display=flex fills the space */}
            <Space direction='vertical' style={{ display: 'flex' }}>
              <GeneSearchBar
                plotUuid={plotUuid}
                experimentId={experimentId}
                searchBarUuid={searchBarUuid}
              />
              <GeneReorderTool
                plotUuid={plotUuid}
              />
            </Space>
          </TabPane>
        </Tabs>
      </Panel>
      <Panel header='Select data' key='select-data'>
        <Space direction='vertical' size='small'>
          <p>Select the cell sets to show markers for:</p>
          <Select
            value={{
              value: config.selectedCellSet,
            }}
            onChange={changeClusters}
            labelInValue
            style={{ width: '100%' }}
            placeholder='Select cell set...'
            options={clustersForSelect}
          />
        </Space>
      </Panel>
      <Panel header='Cluster guardlines' key='cluster-guardlines'>
        <Radio.Group
          value={config.guardLines}
          onChange={(e) => updatePlotWithChanges({ guardLines: e.target.value })}
        >
          <Radio value>Show</Radio>
          <Radio value={false}>Hide</Radio>
        </Radio.Group>
      </Panel>
      <Panel header='Metadata tracks' key='metadata-tracks'>
        <HeatmapMetadataTracksSettings componentType={plotUuid} />
      </Panel>
      <Panel header='Group by' key='group-by'>
        <HeatmapGroupBySettings componentType={plotUuid} />
      </Panel>
    </>
  );

  const renderPlot = () => {
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
              loadMarkerGenes(
                experimentId, louvainClustersResolution,
                plotUuid, config.nMarkerGenes, config.selectedCellSet,
              ),
            )
          }
        />
      );
    }

    if (!config
      || loading.length > 0
      || cellSets.loading
      || loadingMarkerGenes
      || !config.selectedGenes.length) {
      return (<Loader experimentId={experimentId} />);
    }

    if (loadedMarkerGenes.length === 0) {
      return (
        <Empty description='Add some genes to this heatmap to get started.' />
      );
    }

    if (vegaSpec) {
      return <Vega spec={vegaSpec} renderer='canvas' />;
    }
  };

  return (
    <>
      <Header title={plotNames.MARKER_HEATMAP} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={plotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        extraControlPanels={renderExtraPanels()}
        defaultActiveKey='gene-selection'
      >
        {renderPlot()}
      </PlotContainer>
    </>
  );
};

MarkerHeatmap.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default MarkerHeatmap;
