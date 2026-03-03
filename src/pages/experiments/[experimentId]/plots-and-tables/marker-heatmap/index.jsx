import React, { useCallback, useEffect, useState } from 'react';
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
  loadHeatmapGeneExpression,
  loadMarkerGenes,
  updateDownsampledCellOrder,
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
  const [specGeneratedWithTracks, setSpecGeneratedWithTracks] = useState(null);
  const [cellOrderCellSet, setCellOrderCellSet] = useState(null);
  const [previousGroupedTracksKey, setPreviousGroupedTracksKey] = useState(null);

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const configIsLoaded = useSelector((state) => !_.isNil(state.componentConfig[plotUuid]));

  const {
    error, matrix: rawMatrix,
  } = useSelector((state) => state.genes.expression.full);

  const { error: downsampledError } = useSelector((state) => state.genes.expression.downsampled);

  const cellSets = useSelector(getCellSets());
  const { hierarchy } = cellSets;

  const selectedCellSetClassAvailable = useSelector(
    getCellSetsHierarchyByKeys([config?.selectedCellSet]),
  ).length;

  const numLegendItems = useSelector(
    getCellSetsHierarchyByKeys([config?.selectedCellSet]),
  )[0]?.children?.length;

  const { data: loadedGenes = [], markers: loadedGenesAreMarkers = false, fetching: fetchingGenes = false } = useSelector(
    (state) => state.genes.expression.views[plotUuid],
  ) || {};

  const {
    loading: markerGenesLoading,
    error: markerGenesLoadingError,
  } = useSelector((state) => state.genes.markers);

  const louvainClustersResolution = useSelector(
    (state) => state.experimentSettings.processing
      .configureEmbedding?.clusteringSettings.methodSettings.louvain.resolution,
  ) || false;

  const groupedCellSets = useSelector((state) => {
    if (!config?.groupedTracks) return undefined;

    const groupedCellClasses = getCellSetsHierarchyByKeys(config.groupedTracks)(state);
    return groupedCellClasses.map((cellClass) => cellClass.children).flat();
  }, _.isEqual);

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
        loadHeatmapGeneExpression(experimentId, updatesToDispatch.selectedGenes, plotUuid),
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
  useEffect(() => {
    if (config?.selectedGenes === null) {
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
  }, [config?.selectedGenes, experimentId, plotUuid, dispatch, config]);

  // Fetch gene expression data if selectedGenes change and we don't have all the data yet
  useConditionalEffect(() => {
    const expectedConditions = (
      louvainClustersResolution
      && config?.selectedCellSet
      && config?.selectedPoints
      && hierarchy?.length
      && selectedCellSetClassAvailable
      && config?.selectedGenes?.length > 0
      && !fetchingGenes // Skip if genes are already being fetched
    );

    if (!expectedConditions) {
      return;
    }

    // Check if the genes we want to load are already loaded (from the view state)
    const selectedGenesSet = new Set(config.selectedGenes.map((g) => g.toUpperCase()));
    const loadedGenesSet = new Set(loadedGenes.map((g) => g.toUpperCase()));

    // If loaded genes already match selected genes, skip loading
    if (selectedGenesSet.size === loadedGenesSet.size && [...selectedGenesSet].every((g) => loadedGenesSet.has(g))) {
      return;
    }

    dispatch(loadHeatmapGeneExpression(experimentId, config?.selectedGenes, plotUuid));
  }, [
    config?.selectedGenes,
    config?.selectedCellSet,
    config?.selectedPoints,
    hierarchy,
    cellSets.accessible,
    louvainClustersResolution,
    fetchingGenes,
    loadedGenes,
  ]);

  // When marker genes have been loaded, update the config and load their expression data
  useEffect(() => {
    if (!loadedGenesAreMarkers || !loadedGenes || loadedGenes.length === 0) {
      return;
    }

    // Update config with marker genes
    dispatch(updatePlotConfig(plotUuid, { selectedGenes: loadedGenes }));

    // Load expression data for the newly loaded marker genes
    dispatch(loadHeatmapGeneExpression(experimentId, loadedGenes, plotUuid));
  }, [loadedGenes, loadedGenesAreMarkers, plotUuid, experimentId, dispatch]);

  // Compute cellOrder based on configuration and hidden cells
  // Consolidates multiple triggers: selectedPoints, selectedCellSet, groupedTracks, cellOrder reset, hidden cells
  useConditionalEffect(() => {
    if (!config?.groupedTracks || !config?.selectedCellSet) return;

    const currentKey = JSON.stringify(config.groupedTracks);
    if (currentKey !== previousGroupedTracksKey) {
      setPreviousGroupedTracksKey(currentKey);
    }

    dispatch(updatePlotConfig(plotUuid, { cellOrder: null }));
    setCellOrderCellSet(null);
    dispatch(updateDownsampledCellOrder(plotUuid, config?.selectedPoints || null));
  }, [
    config?.selectedPoints,
    config?.selectedCellSet,
    config?.groupedTracks,
    cellSets.hidden,
  ]);

  useEffect(() => {
    // Don't render if cellOrder is stale (computed for different cellSet)
    if (cellOrderCellSet !== config?.selectedCellSet) {
      return;
    }

    if (
      !cellSets.accessible
      || !config?.selectedGenes
      || config.selectedGenes.length === 0
      || fetchingGenes // Don't render while expression data is being fetched
      || !hierarchy?.length
      || downsampledError
      || markerGenesLoadingError
      || markerGenesLoading
      || !config?.cellOrder
      || config.cellOrder.length === 0 // Skip if cellOrder is empty
      || !rawMatrix // Ensure matrix exists
    ) {
      return;
    }

    // Check that the expression data has actually been loaded into the matrix
    // Just having geneIndexes isn't enough - we need the rawGeneExpressions data
    const [cellCount, geneCount] = rawMatrix?.rawGeneExpressions?.size?.() || [0, 0];
    if (!geneCount || geneCount === 0) {
      // Data not ready yet, wait for the expression values to be populated
      return;
    }

    // Reconstruct ExpressionMatrix from plain object (lost prototype after Redux hydration)
    const matrix = new ExpressionMatrix();
    if (rawMatrix?.geneIndexes && rawMatrix?.rawGeneExpressions && rawMatrix?.stats) {
      matrix.geneIndexes = rawMatrix.geneIndexes;
      matrix.rawGeneExpressions = rawMatrix.rawGeneExpressions;
      matrix.stats = rawMatrix.stats;
    }

    const data = generateVegaData(config.cellOrder, matrix, config, cellSets);
    const spec = generateSpec(config, 'Cluster ID', data, config.showGeneLabels);

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

    // Track which selectedTracks this spec was generated with
    setSpecGeneratedWithTracks(config?.selectedTracks);
    setVegaSpec(spec);
  }, [config?.selectedTracks, config?.cellOrder, config?.selectedGenes, config?.selectedCellSet, downsampledError, cellOrderCellSet, cellSets.accessible, fetchingGenes, hierarchy, markerGenesLoadingError, markerGenesLoading, rawMatrix]);

  // Initialize cellOrderCellSet when config is first loaded
  useEffect(() => {
    // Only initialize once - when cellOrderCellSet is still null and config has selectedCellSet
    if (cellOrderCellSet === null && config?.selectedCellSet) {
      setCellOrderCellSet(config.selectedCellSet);
    }
  }, [config?.selectedCellSet, cellOrderCellSet]);

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

  const onGenesChange = useCallback(_.debounce((newGenes) => {
    dispatch(loadHeatmapGeneExpression(experimentId, newGenes, plotUuid));
  }, 1000), []);

  const onGenesSelect = (genes) => {
    const allGenes = _.uniq([...config?.selectedGenes, ...genes]);

    if (_.isEqual(allGenes, config?.selectedGenes)) return;

    // Update the config with new selected genes AND load their expression data
    dispatch(updatePlotConfig(plotUuid, { selectedGenes: allGenes }));
    dispatch(loadHeatmapGeneExpression(experimentId, allGenes, plotUuid));
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
          genesToDisable={config.selectedGenes}
          onUpdate={userUpdatedPlotWithChanges}
          onReset={onReset}
          onGenesChange={onGenesChange}
          onGenesSelect={onGenesSelect}
          showGeneTable={config.selectedGenes?.length > 0}
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
              loadHeatmapGeneExpression(experimentId, config.selectedGenes, plotUuid),
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
              loadHeatmapGeneExpression(experimentId, config.selectedGenes, plotUuid),
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
      || fetchingGenes
      || !cellSets.accessible
      || markerGenesLoading
    ) {
      return (<Loader experimentId={experimentId} />);
    }

    if (config?.cellOrder && config.cellOrder.length === 0) {
      return (
        <Empty description='No matching cells found, try changing your settings in Select Data.' />
      );
    }

    if (!config?.selectedGenes || config.selectedGenes.length === 0) {
      return (
        <Empty description='Add some genes to this heatmap to get started.' />
      );
    }

    // Only render if spec exists AND was generated with current selectedTracks AND expression data is loaded
    const specMatchesCurrentTracks = vegaSpec
      && specGeneratedWithTracks
      && _.isEqual(specGeneratedWithTracks, config?.selectedTracks)
      && !fetchingGenes; // Don't render if still loading gene expression

    if (specMatchesCurrentTracks) {
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
