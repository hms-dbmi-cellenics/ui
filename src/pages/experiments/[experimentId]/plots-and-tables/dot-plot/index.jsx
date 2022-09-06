import React, {
  useState, useEffect, useRef, useMemo,
} from 'react';
import {
  Collapse,
  Skeleton,
  Empty,
  Form,
  Radio,
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
import fileNames from 'utils/fileNames';
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
const searchBarUuid = 'geneSearchBar';

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
  const [reorderAfterFetch, setReorderAfterFetch] = useState(false);
  const [reset, setReset] = useState(false);

  const experimentName = useSelector((state) => state.experimentSettings.info.experimentName);
  const csvFileName = fileNames(experimentName, 'DOT_PLOT', [config?.selectedCellSet, config?.selectedPoints]);

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
    if (!config.useMarkerGenes && config.selectedGenes.length === 0) return false;

    // If using marker genes, check that the selected number is more than 0
    if (config.useMarkerGenes && config.nMarkerGenes === 0) return false;

    if (reset) return false;

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

      previousComparedConfig.current = currentComparedConfig;
      // if the selected genes don't change
      if (_.isEqual(currentSelected, previousSelected)) {
        // if switching back from marker genes to custom genes, reorder data
        if (!config.useMarkerGenes && previousUseMarker) {
          setReorderAfterFetch(true);
        }

        dispatch(getDotPlot(experimentId, plotUuid, config));
        return;
      }

      // if a gene was added
      if (currentSelected.length > previousSelected.length) {
        dispatch(getDotPlot(experimentId, plotUuid, config));
        setReorderAfterFetch(true);
        return;
      }

      // if the genes were reordered
      if (currentSelected.length === previousSelected.length) {
        reorderData(currentSelected);
        return;
      }

      // if genes were removed
      const removedGenes = previousSelected.filter((gene) => !currentSelected.includes(gene));
      deleteData(removedGenes);
    }
  }, [config, cellSets.properties]);

  // if all selected genes are removed, deleteData will not run. Remove plotData manually instead
  useEffect(() => {
    if (config?.useMarkerGenes || config?.selectedGenes.length || !plotData?.length) return;

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

    dispatch(loadPaginatedGeneProperties(experimentId, ['dispersions'], searchBarUuid, state));
  }, []);

  const treeScrollable = document.getElementById('ScrollWrapper');

  useEffect(() => {
    if (treeScrollable) ScrollOnDrag(treeScrollable);
  }, [treeScrollable]);

  // find genes with highest dispersion from list of genes sorted by name
  const loadHighestDispersionGenes = () => {
    const highestDispersions = Object.values(geneData)
      .map((gene) => gene.dispersions)
      .sort()
      .splice(-config.nMarkerGenes);

    const getKeyByValue = (value) => Object.keys(geneData)
      .find((key) => geneData[key].dispersions === value);

    const highestDispersionGenes = highestDispersions.map(
      (dispersion) => getKeyByValue(dispersion),
    );

    updatePlotWithChanges({ selectedGenes: highestDispersionGenes });
  };

  // load initial state, based on highest dispersion genes from all genes
  useEffect(() => {
    if (_.isEmpty(geneData) || !config || plotDataLoading) {
      return;
    }
    loadHighestDispersionGenes();
  }, [geneData]);

  // When fetching new genes, reorder data to match selected genes
  useEffect(() => {
    if (
      plotData?.length !== cellSets.hierarchy[0]?.children.length * config?.selectedGenes.length
      || !reorderAfterFetch
    ) return;

    reorderData(config.selectedGenes);
    setReorderAfterFetch(false);
  }, [plotData]);

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

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const onGenesChange = (genes) => {
    updatePlotWithChanges({ selectedGenes: genes });
  };

  const onReset = () => {
    setReset(true);
    loadHighestDispersionGenes();
  };

  useEffect(() => {
    if (!reset) return;

    dispatch(getDotPlot(experimentId, plotUuid, config));
    setReorderAfterFetch(true);
    setReset(false);
  }, [config]);

  const renderExtraPanels = () => (
    <>
      <Panel header='Gene selection' key='gene-selection'>
        <MarkerGeneSelection
          config={config}
          plotUuid={plotUuid}
          searchBarUuid={searchBarUuid}
          experimentId={experimentId}
          onUpdate={updatePlotWithChanges}
          onReset={onReset}
          onGenesChange={onGenesChange}
        />
      </Panel>
      <Panel header='Select data' key='select-data'>
        <SelectData
          config={config}
          onUpdate={updatePlotWithChanges}
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
        extraToolbarControls={<ExportAsCSV data={getCSVData()} filename={csvFileName} />}
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
