import React, {
  useState, useEffect, useRef, useMemo,
} from 'react';
import {
  Row,
  Col,
  Typography,
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
import PlotStyling from 'components/plots/styling/PlotStyling';
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
  fetchPlotDataWork,
} from 'redux/actions/componentConfig';
import PlatformError from 'components/PlatformError';

import { getCellSets } from 'redux/selectors';

import { plotNames, plotTypes } from 'utils/constants';

const { Panel } = Collapse;
const { Text, Paragraph } = Typography;

const plotUuid = 'dotPlotMain';
const plotType = plotTypes.DOT_PLOT;

const plotStylingControlsConfig = [
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

  const {
    fetching: genesFetching,
    data: highestDispersionGenes,
  } = useSelector((state) => state.genes.properties.views[plotUuid] || {});

  const cellSets = useSelector(getCellSets());
  const {
    loading: cellSetsLoading,
    error: cellSetsError,
    hierarchy: cellSetHierarcy,
    properties: cellSetProperties,
  } = cellSets;

  const [moreThanTwoGroups, setMoreThanTwoGroups] = useState(false);
  const experimentName = useSelector((state) => state.experimentSettings.info.experimentName);
  const csvFileName = fileNames(experimentName, 'DOT_PLOT', [config?.selectedCellSet, config?.selectedPoints]);

  useEffect(() => {
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    if (cellSetHierarcy.length === 0) dispatch(loadCellSets(experimentId));
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

    // If 'All" is chosen for the dropdown, there will always be representation from more than 1 group
    if (filterRootNode === 'All') return true;

    // Ensure that filterKey exists in cellSetProperties
    if (filterKey && !cellSetProperties[filterKey]) return false;

    const filterClusterCellIds = Array.from(cellSetProperties[filterKey].cellIds);

    const baseClusterParent = cellSetHierarcy.find((cellSet) => cellSet.key === baseCluster);
    const baseClusterKeys = baseClusterParent.children.map((child) => child.key);
    const baseClusterCellIds = baseClusterKeys.map((key) => cellSetProperties[key].cellIds);

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
      if (cellSetsLoading || cellSetsError || !config?.selectedCellSet || !config?.selectedPoints) return false;
      return hasGroupsToCompare(config.selectedCellSet, config.selectedPoints);
    },
    [cellSetsLoading, cellSetsError, config?.selectedCellSet, config?.selectedPoints],
  );

  const shouldFetchPlotData = () => {
    if (cellSetsLoading || !config) return false;

    // If using custom genes, check that there are genes in the list
    if (!config.useMarkerGenes && config.selectedGenes.length === 0) return false;

    // If using marker genes, check that the selected number is more than 0
    if (config.useMarkerGenes && config.nMarkerGenes === 0) return false;

    return true;
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
      previousComparedConfig.current = currentComparedConfig;
      dispatch(fetchPlotDataWork(experimentId, plotUuid, plotType));
    }
  }, [config, cellSetProperties]);

  const loadInitialCustomGenes = () => {
    const PROPERTIES = ['dispersions'];
    const tableState = {
      pagination: {
        current: 1, pageSize: config.nMarkerGenes, showSizeChanger: true, total: 0,
      },
      geneNamesFilter: null,
      sorter: { field: PROPERTIES[0], columnKey: PROPERTIES[0], order: 'descend' },
    };

    dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, plotUuid, tableState));
  };

  useEffect(() => {
    if (config?.selectedGenes.length === 0 && !highestDispersionGenes?.length > 0 && !genesFetching) {
      loadInitialCustomGenes();
    }

    if (config?.selectedGenes.length === 0 && highestDispersionGenes?.length > 0) {
      updatePlotWithChanges({ selectedGenes: highestDispersionGenes });
    }
  }, [highestDispersionGenes, config, genesFetching]);

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

  const onGeneEnter = (genes) => {
    updatePlotWithChanges({ selectedGenes: genes });
  };

  const onReset = () => {
    onGeneEnter([]);
    loadInitialCustomGenes();
  };

  const renderExtraPanels = () => (
    <>
      <Panel header='Gene selection' key='gene-selection'>
        <MarkerGeneSelection
          config={config}
          onUpdate={updatePlotWithChanges}
          onReset={onReset}
          onGeneEnter={onGeneEnter}
        />
      </Panel>
      <Panel header='Select data' key='select-data'>
        <SelectData
          config={config}
          onUpdate={updatePlotWithChanges}
          cellSets={cellSets}
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
    if (cellSetsError) {
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
            onClick={() => dispatch(fetchPlotDataWork(experimentId, plotUuid, plotType))}
          />
        </center>
      );
    }

    if (cellSetsLoading || genesFetching || plotDataLoading) {
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
              <Paragraph>
                There is no data to show.
              </Paragraph>
              <Paragraph>
                Select another option from the 'Select data' menu.
              </Paragraph>
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
              <Paragraph>
                There is no data to show.
              </Paragraph>
              <Paragraph>
                <Text type='secondary'>
                  The cell set that you have chosen to display is repesented by only one group.
                  <br />
                  A comparison can not be run to determine the top marker genes.
                </Text>
              </Paragraph>
              <Paragraph>
                Select another option from the 'Select data' menu.
              </Paragraph>
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

  const renderCSVbutton = () => (<ExportAsCSV data={getCSVData()} filename={csvFileName} />);

  return (
    <>
      <Header title={plotNames.DOT_PLOT} />
      <div style={{ width: '100%', padding: '0 16px' }}>
        <Row gutter={16}>
          <Col span={16}>
            <PlotContainer
              experimentId={experimentId}
              plotUuid={plotUuid}
              plotType={plotType}
              extra={renderCSVbutton()}
            >
              {renderPlot()}
            </PlotContainer>
          </Col>
          <Col span={8}>
            <PlotStyling
              formConfig={plotStylingControlsConfig}
              config={config}
              onUpdate={updatePlotWithChanges}
              renderExtraPanels={renderExtraPanels}
              defaultActiveKey='gene-selection'
            />
          </Col>
        </Row>
      </div>
    </>
  );
};

DotPlotPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default DotPlotPage;
