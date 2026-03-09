import React, {
  useState, useEffect, useRef, useMemo,
} from 'react';
import {
  Collapse,
  Skeleton,
  Empty,
  Form,
  Radio,
  Space,
  Slider,
} from 'antd';

import _ from 'lodash';

import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import DotPlot from 'components/plots/DotPlot';
import { loadPaginatedGeneProperties } from 'redux/actions/genes';
import { loadCellSets } from 'redux/actions/cellSets';
import SelectData from 'components/plots/styling/SelectData';
import MarkerGeneSelection from 'components/plots/styling/MarkerGeneSelection';
import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import Loader from 'components/Loader';
import ExportAsCSV from 'components/plots/ExportAsCSV';
import plotCsvFilename from 'utils/plotCsvFilename';
import {
  updatePlotConfig,
  loadPlotConfig,
  getDotPlot,
  updatePlotData,
} from 'redux/actions/componentConfig';

import { getCellSets } from 'redux/selectors';
import { plotNames, plotTypes } from 'utils/constants';
import PlatformError from 'components/PlatformError';

import ScrollOnDrag from 'components/plots/ScrollOnDrag';

const { Panel } = Collapse;

const plotUuid = 'dotPlotMain';
const plotType = plotTypes.DOT_PLOT;
const geneListUuid = 'geneList';

const plotStylingConfig = [
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
    panelTitle: 'Axes and margins',
    controls: ['axes'],
  },
  {
    panelTitle: 'Colours',
    controls: ['colourScheme', 'colourInversion'],
  },
  {
    panelTitle: 'Legend',
    controls: [
      {
        name: 'legend',
        props: {
          option: {
            positions: 'top-bottom',
          },
          showTitleInput: false,
          showTitleSizeInput: true,
          showDirectionInput: false,
        },
      },
    ],
  },
];

const DotPlotPage = (props) => {
  const { experimentId } = props;

  const dispatch = useDispatch();

  const {
    config,
    plotData,
    loading: plotDataLoading,
    error: plotDataError,
  } = useSelector((state) => state.componentConfig[plotUuid]) || {};

  const { data: geneData } = useSelector((state) => state.genes.properties || {});

  const cellSets = useSelector(getCellSets());
  const [moreThanTwoGroups, setMoreThanTwoGroups] = useState(false);

  const experimentName = useSelector((state) => state.experimentSettings.info.experimentName);
  const csvFileName = plotCsvFilename(experimentName, 'DOT_PLOT', [config?.selectedCellSet, config?.selectedPoints]);

  useEffect(() => {
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    if (cellSets.hierarchy.length === 0) dispatch(loadCellSets(experimentId));
  }, []);

  const previousComparedConfig = useRef(null);
  const getComparedConfig = (updatedConfig) => _.pick(
    updatedConfig,
    ['useMarkerGenes',
      'nMarkerGenes',
      'selectedGenes',
      'selectedCellSet',
      'selectedPoints'],
  );

  const hasGroupsToCompare = (baseCluster, filterCluster) => {
    // filterBy has the shape louvain/louvain-1
    const [filterRootNode, filterKey] = filterCluster.split('/');

    // If 'All" is chosen for the dropdown,
    // there will always be representation from more than 1 group
    if (filterRootNode === 'All') return true;

    // Ensure that filterKey exists in cellSetProperties
    if (filterKey && !cellSets.properties[filterKey]) return false;

    const filterClusterCellIds = Array.from(cellSets.properties[filterKey].cellIds);

    const baseClusterParent = cellSets.hierarchy.find((cellSet) => cellSet.key === baseCluster);
    const baseClusterKeys = baseClusterParent.children.map((child) => child.key);
    const baseClusterCellIds = baseClusterKeys.map((key) => cellSets.properties[key].cellIds);

    // Check if there is at least 2 baseClusters with elements common to filterCluster
    let numIntersections = 0;
    return baseClusterCellIds.some((baseCellIds) => {
      if (filterClusterCellIds.some((filterCellId) => baseCellIds.has(filterCellId))) {
        numIntersections += 1;
      }

      return numIntersections === 2;
    });
  };

  const hasMoreThanTwoGroupsToCompare = useMemo(
    () => {
      if (!cellSets.accessible || !config?.selectedCellSet || !config?.selectedPoints) {
        return false;
      }

      return hasGroupsToCompare(config.selectedCellSet, config.selectedPoints);
    }, [cellSets.accessible, config?.selectedCellSet, config?.selectedPoints],
  );

  const shouldFetchPlotData = () => {
    if (!cellSets.accessible || !config) return false;

    // If using custom genes, check that there are genes in the list
    if (!config.useMarkerGenes && (!config.selectedGenes || config.selectedGenes.length === 0)) return false;

    // If using marker genes, check that the selected number is more than 0
    if (config.useMarkerGenes && config.nMarkerGenes === 0) return false;

    return true;
  };

  const reorderData = (order) => {
    if (!plotData) return;

    const cellSetsNames = [...new Set(plotData.map((elem) => elem.cellSets))];
    const reorderedData = [];
    cellSetsNames.forEach((set) => {
      // choose data for a given cell set
      const data = plotData.filter((elem) => elem.cellSets === set);
      // re-order genes for each cell set based on order in selected genes
      const reordered = data.slice().sort(
        (a, b) => order.indexOf(a.geneName) - order.indexOf(b.geneName),
      );
      reorderedData.push(...reordered);
    });

    dispatch(updatePlotData(plotUuid, reorderedData));
  };

  const deleteData = (genes) => {
    if (!plotData) return;

    const data = plotData.filter((elem) => !genes.includes(elem.geneName));
    dispatch(updatePlotData(plotUuid, data));
  };

  useEffect(() => {
    if (!shouldFetchPlotData()) return;

    // Marker genes calculation needs that the cellIds in groupBy (refer to fn definition)
    // be represented by more than one groups in filterBy to enable comparison
    if (config.useMarkerGenes && !hasMoreThanTwoGroupsToCompare) {
      setMoreThanTwoGroups(false);
      return;
    }

    setMoreThanTwoGroups(true);

    const currentComparedConfig = getComparedConfig(config);

    if (config && !_.isEqual(previousComparedConfig.current, currentComparedConfig)) {
      // previous compared config is null on first load, use [] for previous selected genes instead
      const previousSelected = previousComparedConfig.current?.selectedGenes ?? [];
      const currentSelected = currentComparedConfig.selectedGenes;
      const previousUseMarker = previousComparedConfig.current?.useMarkerGenes ?? false;
      const previousNMarkerGenes = previousComparedConfig.current?.nMarkerGenes ?? config.nMarkerGenes;

      // If selectedGenes is null (i.e. config was reset), skip main effect
      // and let the initialization effect handle loading default genes
      if (currentSelected === null) {
        previousComparedConfig.current = currentComparedConfig;
        return;
      }

      // If ONLY useMarkerGenes changed (but not nMarkerGenes and not selectedGenes), skip
      // This is handled by updatePlotWithChanges which has conditional logic
      const useMarkerGenesChanged = config.useMarkerGenes !== previousUseMarker;
      const onlyUseMarkerGenesChanged = useMarkerGenesChanged
        && _.isEqual(currentSelected, previousSelected)
        && config.nMarkerGenes === previousNMarkerGenes;

      if (onlyUseMarkerGenesChanged) {
        previousComparedConfig.current = currentComparedConfig;
        return;
      }

      // Capture previous data-affecting field values before updating reference
      const previousCellSet = previousComparedConfig.current?.selectedCellSet;
      const previousPoints = previousComparedConfig.current?.selectedPoints;

      previousComparedConfig.current = currentComparedConfig;
      // if the selected genes don't change
      if (_.isEqual(currentSelected, previousSelected)) {
        // Check if data-affecting fields (cell set or points) changed
        const currentCellSet = currentComparedConfig.selectedCellSet;
        const currentPoints = currentComparedConfig.selectedPoints;

        const dataFieldsChanged = !_.isEqual(previousCellSet, currentCellSet)
          || !_.isEqual(previousPoints, currentPoints);

        if (dataFieldsChanged) {
          // Clear old plot data before fetching new data to prevent rendering mismatch
          // (stale data with new cell set configuration)
          dispatch(updatePlotData(plotUuid, []));
          // Cell set or points changed - fetch new data (spec generator will reorder by selectedGenes)
          dispatch(getDotPlot(experimentId, plotUuid, config));
        }
        // If only styling fields changed (useAbsoluteScale, dimensions, colors, etc.), skip getDotPlot
        return;
      }

      // if a gene was added
      if (currentSelected.length > previousSelected.length) {
        // Gene added - but skip if we're in marker genes mode (selectedGenes changed due to sync from getDotPlot)
        // In marker genes mode, getDotPlot was already called and genes synced back, don't fetch again
        if (config.useMarkerGenes) {
          return;
        }
        // Gene added in custom genes mode, fetch new data (spec generator will reorder by selectedGenes)
        dispatch(getDotPlot(experimentId, plotUuid, config));
        return;
      }

      // if the genes were reordered (same genes, different order)
      if (currentSelected.length === previousSelected.length
        && _.isEqual(_.sortBy(currentSelected), _.sortBy(previousSelected))) {
        // Just update config (spec generator will reorder when rendering)
        dispatch(updatePlotConfig(plotUuid, { selectedGenes: currentSelected }));
        return;
      }

      // if genes were removed
      const removedGenes = previousSelected.filter((gene) => !currentSelected.includes(gene));
      deleteData(removedGenes);
    }
  }, [config, cellSets.properties]);

  // Calculate the default radius based on plot dimensions and data
  const calculateDefaultRadius = useMemo(() => {
    if (!config || !plotData || plotData.length === 0) return 15; // fallback default

    const plotWidth = config.dimensions.width;
    const plotHeight = config.dimensions.height;
    const padding = 1;
    const adjustment = 2;

    // Get unique genes from actual data
    const uniqueGenes = new Set(plotData.map((d) => d.geneName));
    const numGenes = uniqueGenes.size;

    // Count unique clusters
    const uniqueClusters = new Set(plotData.map((d) => d.cellSets));
    const numClusters = uniqueClusters.size;

    const heightPerDot = plotHeight / (numClusters + adjustment);
    const widthPerDot = plotWidth / (numGenes + adjustment);

    const radiusWithPadding = Math.floor(Math.min(heightPerDot, widthPerDot) / 2);
    let radius = radiusWithPadding - padding;

    // Cap to valid slider range [3, 20] - max is 20
    radius = Math.max(3, Math.min(20, radius));

    return radius;
  }, [config, plotData]);

  // Keep maxPointRadius in sync with calculateDefaultRadius whenever it changes (e.g., on gene selection change)
  useEffect(() => {
    if (!config) return;

    // Reset to new default whenever calculateDefaultRadius changes
    dispatch(updatePlotConfig(plotUuid, { maxPointRadius: calculateDefaultRadius }));
  }, [calculateDefaultRadius, plotUuid, dispatch]);

  // Calculate slider bounds
  const sliderBounds = useMemo(() => ({
    min: Math.max(3, calculateDefaultRadius - 5),
    max: Math.min(20, calculateDefaultRadius + 5),
  }), [calculateDefaultRadius]);

  // if all selected genes are removed, deleteData will not run. Remove plotData manually instead
  useEffect(() => {
    if (config?.useMarkerGenes
      || config?.selectedGenes?.length
      || !plotData?.length
      || !previousComparedConfig.current
    ) return;

    previousComparedConfig.current.selectedGenes = [];
    dispatch(updatePlotData(plotUuid, []));
  }, [config]);

  // load the gene names and dispersions for search table and initial state
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

    dispatch(loadPaginatedGeneProperties(experimentId, ['dispersions'], geneListUuid, state));
  }, []);

  const treeScrollable = document.getElementById('ScrollWrapper');

  useEffect(() => {
    if (treeScrollable) ScrollOnDrag(treeScrollable);
  }, [treeScrollable]);

  // If selectedGenes is null (initial state or after reset), load the 3 highest dispersion genes
  useEffect(() => {
    if (config?.selectedGenes !== null || _.isEmpty(geneData) || !config) {
      return;
    }

    const highestDispersionGenes = getHighestDispersionGenes();
    updatePlotWithChanges({ selectedGenes: highestDispersionGenes });

    // Update previousComparedConfig so the main effect knows to skip processing this gene change
    // This prevents getDotPlot from being called twice on reset
    previousComparedConfig.current = getComparedConfig({
      ...config,
      selectedGenes: highestDispersionGenes,
    });
  }, [geneData, config?.selectedGenes]);

  const getCSVData = () => {
    if (!plotData?.length) return [];
    const newData = plotData?.map(({
      avgExpression, cellsPercentage, geneName, cellSets: clusterName,
    }) => ({
      Gene: geneName,
      Cluster: clusterName,
      'Average expression': avgExpression,
      'Fraction of cells expressing gene': cellsPercentage,
    }));
    const newDataSorted = _.orderBy(newData, ['Gene'], ['asc']);
    return newDataSorted;
  };

  const onUpdateSelectData = (obj) => {
    const selectedCellSet = Object.values(obj)[0];
    const updateObj = { axes: { yAxisText: cellSets.properties[selectedCellSet]?.name }, ...obj };
    // Clear plot data immediately when cell set/points change to avoid rendering mismatch
    dispatch(updatePlotData(plotUuid, []));
    updatePlotWithChanges(updateObj);
  };

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));

    // Only call work requests if relevant fields changed
    // Toggles of useMarkerGenes without nMarkerGenes change should NOT trigger work requests
    if (obj.nMarkerGenes) {
      // When nMarkerGenes changes, call getDotPlot to load marker genes
      dispatch(getDotPlot(experimentId, plotUuid, { ...config, ...obj }));
    } else if (obj.selectedGenes && obj.selectedGenes.length > 0) {
      // When selectedGenes changes, call getDotPlot (but not when clearing all genes)
      dispatch(getDotPlot(experimentId, plotUuid, { ...config, ...obj }));
    }
  };

  const onGenesChange = (genes) => {
    // Check if this is a reordering (same genes, different order) or an actual change (add/remove)
    const currentGenes = config?.selectedGenes || [];

    // Skip if genes haven't actually changed
    if (_.isEqual(genes, currentGenes)) return;

    const isReordering = genes.length === currentGenes.length
      && _.isEqual(_.sortBy(genes), _.sortBy(currentGenes));

    if (isReordering) {
      // Just update config without calling getDotPlot - the effect will handle reordering locally
      dispatch(updatePlotConfig(plotUuid, { selectedGenes: genes }));
    } else if (genes.length > currentGenes.length) {
      // Gene added - fetch new data from backend
      updatePlotWithChanges({ selectedGenes: genes });
    } else {
      // Gene removed - just update config, let effect handle deleteData locally
      dispatch(updatePlotConfig(plotUuid, { selectedGenes: genes }));
    }
  };

  const onGenesSelect = (genes) => {
    const allGenes = _.uniq([...config?.selectedGenes, ...genes]);

    if (_.isEqual(allGenes, config?.selectedGenes)) return;

    updatePlotWithChanges({ selectedGenes: allGenes });
  };

  const getHighestDispersionGenes = () => {
    // Calculate the 3 highest dispersion genes
    const NUM_GENES_FOR_RESET = 3;
    const highestDispersions = Object.values(geneData)
      .map((gene) => gene.dispersions)
      .sort()
      .splice(-NUM_GENES_FOR_RESET);

    const getKeyByValue = (value) => Object.keys(geneData)
      .find((key) => geneData[key].dispersions === value);

    return highestDispersions.map(
      (dispersion) => getKeyByValue(dispersion),
    );
  };

  const onResetGenes = () => {
    // Reset selectedGenes to the 3 highest dispersion genes, keeping all other config the same
    const highestDispersionGenes = getHighestDispersionGenes();
    updatePlotWithChanges({ selectedGenes: highestDispersionGenes });
  };

  const renderExtraPanels = () => (
    <>
      <Panel header='Gene selection' key='gene-selection'>
        <MarkerGeneSelection
          config={config}
          plotUuid={plotUuid}
          genesToDisable={config?.selectedGenes}
          onUpdate={updatePlotWithChanges}
          onReset={onResetGenes}
          onGenesChange={onGenesChange}
          onGenesSelect={onGenesSelect}
        />
      </Panel>
      <Panel header='Select data' key='select-data'>
        <SelectData
          config={config}
          onUpdate={onUpdateSelectData}
          cellSets={cellSets}
          firstSelectionText='Select the cell sets or metadata that cells are grouped by (determines the y-axis)'
        />
      </Panel>
      <Panel header='Size scale' key='size-scale'>
        <Form>
          <Form.Item>
            <Radio.Group
              onChange={(e) => updatePlotWithChanges({ useAbsoluteScale: e.target.value })}
              value={config.useAbsoluteScale}
            >
              <Radio key='absolute' value>Absolute</Radio>
              <Radio key='relative' value={false}>Relative</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label='Max Radius' labelCol={{ span: 10, style: { textAlign: 'left' } }} wrapperCol={{ span: 12 }} style={{ marginBottom: 0, marginTop: '15px' }}>
            <Slider
              value={config.maxPointRadius || calculateDefaultRadius}
              min={sliderBounds.min}
              max={sliderBounds.max}
              onChange={(value) => updatePlotWithChanges({ maxPointRadius: value })}
              marks={{
                [sliderBounds.min]: sliderBounds.min,
                [sliderBounds.max]: sliderBounds.max,
              }}
            />
          </Form.Item>
        </Form>
      </Panel>
    </>
  );

  if (!config) {
    return <Skeleton />;
  }

  const renderPlot = () => {
    if (cellSets.error) {
      return (
        <center>
          <PlatformError
            description='Error loading cell sets'
            onClick={() => dispatch(loadCellSets(experimentId))}
          />
        </center>
      );
    }

    if (plotDataError) {
      return (
        <center>
          <PlatformError
            description='Error loading plot data.'
            reason='Check the options that you have selected and try again.'
            onClick={() => dispatch(getDotPlot(experimentId, plotUuid, config))}
          />
        </center>
      );
    }

    if (!cellSets.accessible || plotDataLoading) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    // Show loader while waiting for plot data to load (regardless of selected genes)
    // This prevents flashing "no data" messages during data fetch
    if (plotDataLoading) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    if (!plotData?.length > 0) {
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

    if (!moreThanTwoGroups) {
      return (
        <center>
          <Empty description={(
            <>
              <p>
                There is no data to show.
              </p>
              <p>
                The cell set that you have chosen to display is repesented by only one group.
                <br />
                A comparison can not be run to determine the top marker genes.
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

    return (
      <center>
        <DotPlot experimentId={experimentId} config={config} plotData={plotData} />
      </center>
    );
  };

  return (
    <>
      <Header title={plotNames.DOT_PLOT} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={plotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        extraToolbarControls={(
          <Space>
            <ExportAsCSV data={getCSVData()} filename={csvFileName} />
          </Space>
        )}
        extraControlPanels={renderExtraPanels()}
        defaultActiveKey='gene-selection'
      >
        {renderPlot()}
      </PlotContainer>
    </>
  );
};

DotPlotPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default DotPlotPage;
