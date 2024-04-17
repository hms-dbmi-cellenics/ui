import React, { useCallback, useEffect, useState } from 'react';
import {
  Collapse,
  Skeleton,
  Empty,
  Radio,
  Space,
} from 'antd';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';
import 'vega-webgl-renderer';

import { getCellSets, getCellSetsHierarchyByKeys } from 'redux/selectors';

import HeatmapGroupBySettings from 'components/data-exploration/heatmap/HeatmapGroupBySettings';
import HeatmapMetadataTracksSettings from 'components/data-exploration/heatmap/HeatmapMetadataTrackSettings';

import MarkerGeneSelection from 'components/plots/styling/MarkerGeneSelection';
import loadProcessingSettings from 'redux/actions/experimentSettings/processingConfig/loadProcessingSettings';
import { updatePlotConfig, loadPlotConfig } from 'redux/actions/componentConfig';
import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import { generateSpec } from 'utils/plotSpecs/generateHeatmapSpec';
import { loadDownsampledGeneExpression, loadMarkerGenes } from 'redux/actions/genes';
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

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const configIsLoaded = useSelector((state) => !_.isNil(state.componentConfig[plotUuid]));

  const {
    error, loading, matrix, cellOrder,
  } = useSelector((state) => state.genes.expression.downsampled);

  const cellSets = useSelector(getCellSets());
  const { hierarchy } = cellSets;

  const selectedCellSetClassAvailable = useSelector(
    getCellSetsHierarchyByKeys([config?.selectedCellSet]),
  ).length;

  const numLegendItems = useSelector(
    getCellSetsHierarchyByKeys([config?.selectedCellSet]),
  )[0]?.children?.length;

  const { data: loadedGenes = [], markers: loadedGenesAreMarkers = false } = useSelector(
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
        loadDownsampledGeneExpression(experimentId, updatesToDispatch.selectedGenes, plotUuid),
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
  }, [config]);

  useConditionalEffect(() => {
    const expectedConditions = (
      louvainClustersResolution
      && config?.groupedTracks
      && config?.selectedCellSet
      && config?.selectedPoints
      && hierarchy?.length
      && selectedCellSetClassAvailable
      && config?.selectedGenes?.length > 0
      && !markerGenesLoading
    );
    if (!expectedConditions) return;

    dispatch(loadDownsampledGeneExpression(experimentId, config?.selectedGenes, plotUuid));
  }, [
    config?.groupedTracks,
    config?.selectedCellSet,
    config?.selectedPoints,
    hierarchy,
    cellSets.accessible,
    louvainClustersResolution,
    groupedCellSets,
  ]);

  // When marker genes have been loaded, update the config with those
  useConditionalEffect(() => {
    if (!config || _.isEqual(loadedGenes, config.selectedGenes)) {
      return;
    }

    // IMPORTANT This update is NOT performed by a user action, but by loadMarkerGenes work result
    // So don't replace this with userUpdatedPlotWithChanges
    dispatch(updatePlotConfig(plotUuid, { selectedGenes: loadedGenes }));
  }, [loadedGenes, loadedGenesAreMarkers]);

  useEffect(() => {
    if (
      !cellSets.accessible
      || _.isEmpty(loadedGenes)
      || !loading
      || !hierarchy?.length
      || markerGenesLoadingError
      || markerGenesLoading
      || config?.selectedGenes === null
    ) {
      return;
    }

    const data = generateVegaData(cellOrder, matrix, config, cellSets);
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

    setVegaSpec(spec);
  }, [config, cellOrder]);

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
          },
        },
      ],
    },
  ];

  const onGenesChange = useCallback(_.debounce((newGenes) => {
    dispatch(loadDownsampledGeneExpression(experimentId, newGenes, plotUuid));
  }, 1000), []);

  const onGenesSelect = (genes) => {
    const allGenes = _.uniq([...config?.selectedGenes, ...genes]);

    if (_.isEqual(allGenes, config?.selectedGenes)) return;

    dispatch(loadDownsampledGeneExpression(experimentId, allGenes, plotUuid));
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
          <p>Gene labels:</p>
          <Radio.Group
            onChange={
              (e) => userUpdatedPlotWithChanges({ showGeneLabels: e.target.value })
            }
            value={config.showGeneLabels}
          >
            <Radio value>Show</Radio>
            <Radio value={false}>Hide</Radio>
          </Radio.Group>
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
              loadDownsampledGeneExpression(experimentId, config.selectedGenes, plotUuid),
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
      || loading.length > 0
      || !cellSets.accessible
      || markerGenesLoading
    ) {
      return (<Loader experimentId={experimentId} />);
    }

    if (cellOrder.length === 0) {
      return (
        <Empty description='No matching cells found, try changing your settings in Select Data.' />
      );
    }

    if (loadedGenes.length === 0) {
      return (
        <Empty description='Add some genes to this heatmap to get started.' />
      );
    }

    if (vegaSpec) {
      return (
        <Space direction='vertical'>
          {config.legend.showAlert
            && numLegendItems > MAX_LEGEND_ITEMS
            && <PlotLegendAlert />}
          <center>
            <Vega spec={vegaSpec} renderer='webgl' />
          </center>
        </Space>
      );
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
