import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  Collapse,
  Skeleton,
  Empty,
  Radio,
  Space,
  Slider,
  Form,
} from 'antd';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';
import 'vega-webgl-renderer';

import ExpressionMatrix from 'utils/ExpressionMatrix/ExpressionMatrix';
import { getCellSets, getCellSetsHierarchyByKeys } from 'redux/selectors';

import HeatmapGroupBySettings from 'components/data-exploration/heatmap/HeatmapGroupBySettings';
import HeatmapMetadataTracksSettings from 'components/data-exploration/heatmap/HeatmapMetadataTrackSettings';

import MarkerGeneSelection from 'components/plots/styling/MarkerGeneSelection';
import loadProcessingSettings from 'redux/actions/experimentSettings/processingConfig/loadProcessingSettings';
import { updatePlotConfig, loadPlotConfig } from 'redux/actions/componentConfig';
import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import { generateSpec } from 'utils/plotSpecs/generateHeatmapSpec';
import {
  loadGeneExpression,
  loadMarkerGenes,
} from 'redux/actions/genes';
import loadGeneList from 'redux/actions/genes/loadGeneList';
import { loadCellSets } from 'redux/actions/cellSets';
import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';
import SelectData from 'components/plots/styling/SelectData';

import generateVegaData from 'components/plots/helpers/heatmap/vega/generateVegaData';
import { plotNames } from 'utils/constants';

import PlotLegendAlert, { MAX_LEGEND_ITEMS } from 'components/plots/helpers/PlotLegendAlert';

import ScrollOnDrag from 'components/plots/ScrollOnDrag';
import useConditionalEffect from 'utils/customHooks/useConditionalEffect';

const { Panel } = Collapse;
const plotUuid = 'markerHeatmapPlotMain';
const plotType = 'markerHeatmap';

const MarkerHeatmap = ({ experimentId }) => {
  const dispatch = useDispatch();

  const [vegaSpec, setVegaSpec] = useState();
  const [cellOrder, setCellOrder] = useState(null);

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const configIsLoaded = useSelector((state) => !_.isNil(state.componentConfig[plotUuid]));

  // Extract specific config properties as separate selectors to prevent render effect 
  // from re-running when other config properties change (colors, sizes, etc)

  const selectedTracks = useSelector((state) => state.componentConfig[plotUuid]?.config?.selectedTracks);
  const selectedCellSetConfig = useSelector((state) => state.componentConfig[plotUuid]?.config?.selectedCellSet);

  const {
    error, matrix: rawMatrix, loading: expressionLoading,
  } = useSelector((state) => state.genes.expression.full);

  const { error: downsampledError } = useSelector((state) => state.genes.expression.downsampled);

  const { fetching: expressionFetching } = useSelector(
    (state) => state.genes.expression.views[plotUuid],
  ) || {};

  const cellSets = useSelector(getCellSets());
  const { hierarchy } = cellSets;

  const selectedCellSetClassAvailable = useSelector(
    getCellSetsHierarchyByKeys([config?.selectedCellSet]),
  ).length;

  const numLegendItems = useSelector(
    getCellSetsHierarchyByKeys([config?.selectedCellSet]),
  )[0]?.children?.length;

  const loadedGenes = config?.selectedGenes || [];

  const {
    loading: markerGenesLoading,
    error: markerGenesLoadingError,
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

  const userUpdatedPlotWithChanges = (userUpdatedField) => {
    let updatesToDispatch = userUpdatedField;

    if (updatesToDispatch.selectedCellSet) {
      // grouping and metadata tracks should change when selectedCellSet is changed
      updatesToDispatch = {
        ...updatesToDispatch,
        selectedTracks: [updatesToDispatch.selectedCellSet],
        groupedTracks: [updatesToDispatch.selectedCellSet],
      };
    }

    dispatch(updatePlotConfig(plotUuid, updatesToDispatch));

    if (updatesToDispatch.nMarkerGenes) {
      dispatch(loadMarkerGenes(
        experimentId,
        plotUuid,
        {
          numGenes: updatesToDispatch.nMarkerGenes,
          groupedTracks: config.groupedTracks,
          selectedCellSet: config.selectedCellSet,
          selectedPoints: config.selectedPoints,
        },
      ));
    } else if (updatesToDispatch.selectedGenes) {
      dispatch(
        loadGeneExpression(experimentId, updatesToDispatch.selectedGenes, plotUuid),
      );
    }
  };

  useEffect(() => {
    if (!configIsLoaded
      || !cellSets.accessible
      || !config.legend.enabled) return;

    const showAlert = numLegendItems > MAX_LEGEND_ITEMS;

    if (showAlert) userUpdatedPlotWithChanges({ legend: { showAlert, enabled: !showAlert } });
  }, [configIsLoaded, cellSets.accessible]);

  // If the plot has never been loaded (so has no selectedGenes), then load the marker genes
  // Only auto-load on initial render, not when user clears genes
  useEffect(() => {
    const selectedGenesEmpty = !config?.selectedGenes || config.selectedGenes.length === 0;

    if (selectedGenesEmpty && config?.nMarkerGenes) {
      dispatch(loadMarkerGenes(
        experimentId,
        plotUuid,
        {
          numGenes: config.nMarkerGenes,
          groupedTracks: config.groupedTracks,
          selectedCellSet: config.selectedCellSet,
          selectedPoints: config.selectedPoints,
        },
      ));
    }
  }, [
    config?.nMarkerGenes,
    JSON.stringify(config?.groupedTracks),
    config?.selectedCellSet,
    config?.selectedPoints,
    config?.selectedGenes,
  ]);

  // Clear the spec when marker genes start loading to prevent showing stale spec with old genes
  useEffect(() => {
    if (markerGenesLoading) {
      setVegaSpec(undefined);
    }
  }, [markerGenesLoading]);

  // When marker genes finish loading, update the plot
  useEffect(() => {
    // Just a marker for when gene loading completes
  }, [markerGenesLoading, config?.selectedGenes]);

  // Fetch gene expression data if loadedGenes change and we don't have all the data yet
  // Only run this when we're in marker genes mode (custom genes are handled by onGenesChange)
  useConditionalEffect(() => {

    const expectedConditions = (
      louvainClustersResolution
      && config?.selectedCellSet
      && config?.selectedPoints
      && hierarchy?.length
      && selectedCellSetClassAvailable
      && loadedGenes?.length > 0
    );

    if (!expectedConditions) {
      return;
    }
    dispatch(loadGeneExpression(experimentId, loadedGenes, plotUuid));
  }, [
    loadedGenes,
    config?.selectedCellSet,
    config?.selectedPoints,
    hierarchy,
    cellSets.accessible,
    louvainClustersResolution,
  ]);

  useEffect(() => {
    // Don't create spec while marker genes are loading (prevents stale spec recreation)
    if (markerGenesLoading || expressionFetching) {
      return;
    }


    // Check preconditions: data is loaded and ready
    // cellOrder will be computed internally by generateVegaData
    if (
      !cellSets.accessible
      || !cellSets.hierarchy?.length
      || !loadedGenes?.length
      || !hierarchy?.length
      || !rawMatrix
    ) {
      return;
    }

    // Check preconditions: no errors and data is not fetching
    if (downsampledError || markerGenesLoadingError) {
      return;
    }

    // Check that the expression data has actually been loaded into the matrix
    // Just having geneIndexes isn't enough - we need the rawGeneExpressions data
    const [cellCount, geneCount] = rawMatrix?.rawGeneExpressions?.size?.() || [0, 0];

    if (!geneCount || geneCount === 0) {
      // Data not ready yet, wait for the expression values to be populated
      return;
    }

    // Verify that the matrix has ALL the genes we need to render
    // Note: matrix can have MORE genes than loadedGenes (it accumulates genes from previous operations)
    // We only care that all genes in loadedGenes are present in the matrix
    const matrixGeneIndexes = rawMatrix?.geneIndexes || {};
    const allGenesAvailable = loadedGenes.every((gene) => matrixGeneIndexes[gene] !== undefined);

    if (!allGenesAvailable) {
      // Not all genes are in the matrix yet, wait for expression data to be fully loaded
      return;
    }

    // Reconstruct ExpressionMatrix from plain object (lost prototype after Redux hydration)
    const matrix = new ExpressionMatrix();
    if (rawMatrix?.geneIndexes && rawMatrix?.rawGeneExpressions && rawMatrix?.stats) {
      matrix.geneIndexes = rawMatrix.geneIndexes;
      matrix.rawGeneExpressions = rawMatrix.rawGeneExpressions;
      matrix.stats = rawMatrix.stats;
    }

    // Pass loadedGenes as selectedGenes to vega data generator
    // This ensures we render the loaded genes instead of config.selectedGenes which may be empty
    // generateVegaData will internally compute cellOrder based on config
    const vegaData = generateVegaData(matrix, { ...config, selectedGenes: loadedGenes }, cellSets);
    const { cellOrder: computedCellOrder } = vegaData;
    setCellOrder(computedCellOrder);
    const spec = generateSpec(config, 'Cluster ID', vegaData, config.showGeneLabels);

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
  }, [selectedTracks, loadedGenes, selectedCellSetConfig, config?.selectedPoints, config?.groupedTracks, downsampledError, cellSets.accessible, cellSets.hierarchy, cellSets.hidden, hierarchy, markerGenesLoadingError, markerGenesLoading, rawMatrix, expressionFetching]);

  useEffect(() => {
    dispatch(loadGeneList(experimentId));
  }, []);

  const treeScrollable = document.getElementById('ScrollWrapper');

  useEffect(() => {
    if (treeScrollable) ScrollOnDrag(treeScrollable);
  }, [treeScrollable]);

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
            defaultTitle: 'Cluster ID',
          },
        },
      ],
    },
  ];

  const onGenesChange = useCallback((newGenes) => {
    // Update config with the new gene order first (single source of truth)
    dispatch(updatePlotConfig(plotUuid, { selectedGenes: newGenes }));
    // Then load gene expression with the new order
    dispatch(loadGeneExpression(experimentId, newGenes, plotUuid));
  }, [experimentId, plotUuid, dispatch]);

  const onGenesSelect = (genes) => {
    const allGenes = _.uniq([...loadedGenes, ...genes]);

    if (_.isEqual(allGenes, loadedGenes)) return;

    // Load the selected genes (updates genes.expression.views)
    dispatch(loadGeneExpression(experimentId, allGenes, plotUuid));
  };

  const onReset = () => {
    dispatch(loadMarkerGenes(
      experimentId,
      plotUuid,
      {
        numGenes: config.nMarkerGenes,
        groupedTracks: config.groupedTracks,
        selectedCellSet: config.selectedCellSet,
        selectedPoints: config.selectedPoints,
      },
    ));
  };

  if (!config || !cellSets.accessible || hierarchy.length === 0) {
    return (<Skeleton />);
  }

  const renderExtraPanels = () => (
    <>
      <Panel header='Gene selection' key='gene-selection'>
        <MarkerGeneSelection
          config={config}
          plotUuid={plotUuid}
          genesToDisable={loadedGenes}
          onUpdate={userUpdatedPlotWithChanges}
          onReset={onReset}
          onGenesChange={onGenesChange}
          onGenesSelect={onGenesSelect}
          showGeneTable={loadedGenes?.length > 0}
        />
        <div style={{ paddingTop: '10px' }}>
          <p><strong>Gene labels:</strong></p>
          <Radio.Group
            onChange={
              (e) => userUpdatedPlotWithChanges({ showGeneLabels: e.target.value })
            }
            value={config.showGeneLabels}
          >
            <Radio value>Show</Radio>
            <Radio value={false}>Hide</Radio>
          </Radio.Group>
          {config.showGeneLabels && (
            <Form style={{ marginTop: '15px' }}>
              <Form.Item
                label='Font Size'
                labelCol={{ span: 5, style: { textAlign: 'left' } }}
                wrapperCol={{ span: 19 }}
                style={{ marginBottom: 0 }}
              >
                <Slider
                  value={config.geneLabelSize || 10}
                  min={6}
                  max={20}
                  onChange={(value) => {
                    userUpdatedPlotWithChanges({ geneLabelSize: value });
                  }}
                  marks={{ 6: 6, 20: 20 }}
                />
              </Form.Item>
            </Form>
          )}
        </div>
      </Panel>
      <Panel header='Select data' key='select-data'>
        <SelectData
          config={config}
          onUpdate={userUpdatedPlotWithChanges}
          cellSets={cellSets}
          firstSelectionText='Select the cell sets or metadata to show markers for'
          secondSelectionText='Select the cell set, sample or metadata group to be shown'
        />
      </Panel>
      <Panel header='Cluster guardlines' key='cluster-guardlines'>
        <Radio.Group
          value={config.guardLines}
          onChange={(e) => userUpdatedPlotWithChanges({ guardLines: e.target.value })}
        >
          <Radio value>Show</Radio>
          <Radio value={false}>Hide</Radio>
        </Radio.Group>
      </Panel>
      <Panel header='Metadata tracks' key='metadata-tracks'>
        <HeatmapMetadataTracksSettings componentType={plotUuid} />
        <div style={{ paddingTop: '15px' }}>
          <p><strong>Metadata labels:</strong></p>
          <Radio.Group
            onChange={
              (e) => userUpdatedPlotWithChanges({ showMetadataLabels: e.target.value })
            }
            value={config.showMetadataLabels}
          >
            <Radio value>Show</Radio>
            <Radio value={false}>Hide</Radio>
          </Radio.Group>
          {config.showMetadataLabels && (
            <Form style={{ marginTop: '15px' }}>
              <Form.Item
                label='Font Size:'
                labelCol={{ span: 5, style: { textAlign: 'left' } }}
                wrapperCol={{ span: 19 }}
                style={{ marginBottom: 0 }}
              >
                <Slider
                  value={config.metadataLabelSize || 10}
                  min={6}
                  max={20}
                  onChange={(value) => {
                    userUpdatedPlotWithChanges({ metadataLabelSize: value });
                  }}
                  marks={{ 6: 6, 20: 20 }}
                />
              </Form.Item>
            </Form>
          )}
        </div>
      </Panel>
      <Panel header='Group by' key='group-by'>
        <HeatmapGroupBySettings componentType={plotUuid} />
      </Panel>
    </>
  );

  const hasEnoughCellSets = (cellSet) => {
    const chosenCellSet = cellSets.hierarchy.find(({ key }) => key === cellSet);
    return chosenCellSet.children.length === 0;
  };

  const renderPlot = () => {
    if (hasEnoughCellSets(config.selectedCellSet)) {
      return (
        <center>
          <Empty description={(
            <>
              <p>
                There is no data to show.
              </p>
              <p>
                Select another option from the 'Select data' menu.
              </p>
            </>
          )}
          />
        </center>
      );
    }

    if (error) {
      return (
        <PlatformError
          description='Could not load gene expression data.'
          error={error}
          onClick={() => {
            dispatch(
              loadGeneExpression(experimentId, loadedGenes, plotUuid),
            );
          }}
        />
      );
    }

    if (downsampledError) {
      return (
        <PlatformError
          description='Could not load gene expression data.'
          error={downsampledError}
          onClick={() => {
            dispatch(
              loadGeneExpression(experimentId, loadedGenes, plotUuid),
            );
          }}
        />
      );
    }

    if (markerGenesLoadingError) {
      return (
        <PlatformError
          description='Could not load marker genes.'
          error={markerGenesLoadingError}
          onClick={
            () => dispatch(
              loadMarkerGenes(
                experimentId,
                plotUuid,
                {
                  numGenes: config.nMarkerGenes,
                  groupedTracks: config.groupedTracks,
                  selectedCellSet: config.selectedCellSet,
                  selectedPoints: config.selectedPoints,
                },
              ),
            )
          }
        />
      );
    }

    if (
      !config
      || !cellSets.accessible
      || markerGenesLoading
      || expressionFetching
    ) {
      return (<Loader experimentId={experimentId} />);
    }

    if (cellOrder && cellOrder.length === 0) {
      return (
        <Empty description='No matching cells found, try changing your settings in Select Data.' />
      );
    }

    if (!loadedGenes || loadedGenes.length === 0) {
      return (
        <Empty description='Add some genes to this heatmap to get started.' />
      );
    }

    // Only render if spec exists and expression data is loaded
    // Don't show the plot while marker genes are loading (even if spec exists with old genes)
    const specIsReady = vegaSpec && !markerGenesLoading;

    if (specIsReady) {
      return (
        <Space direction='vertical'>
          {config.legend.showAlert
            && numLegendItems > MAX_LEGEND_ITEMS
            && <PlotLegendAlert />}
          <center>
            <Vega key={`heatmap-${config.selectedTracks?.join(',')}`} spec={vegaSpec} renderer='webgl' />
          </center>
        </Space>
      );
    }

    // If spec isn't ready yet, show loading
    return (<Loader experimentId={experimentId} />);
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
