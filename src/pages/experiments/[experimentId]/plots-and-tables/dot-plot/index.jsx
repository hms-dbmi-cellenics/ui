import React, { useEffect, useRef } from 'react';
import {
  Row,
  Col,
  Space,
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
import Header from 'components/plots/Header';
import Loader from 'components/Loader';

import {
  updatePlotConfig,
  loadPlotConfig,
  fetchPlotDataWork,
} from 'redux/actions/componentConfig';
import PlatformError from 'components/PlatformError';

import { plotTypes } from 'utils/constants';

const { Panel } = Collapse;
const plotUuid = 'dotPlotMain';
const plotType = plotTypes.DOT_PLOT;
const route = {
  path: 'dot-plot',
  breadcrumbName: 'Dot plot',
};

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

  const cellSets = useSelector((state) => state.cellSets);
  const {
    loading: cellSetsLoading,
    error: cellSetsError,
    hierarchy,
  } = cellSets;

  useEffect(() => {
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    if (hierarchy.length === 0) dispatch(loadCellSets(experimentId));
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

  useEffect(() => {
    const currentComparedConfig = getComparedConfig(config);
    if (config && !_.isEqual(previousComparedConfig.current, currentComparedConfig)) {
      previousComparedConfig.current = currentComparedConfig;
      dispatch(fetchPlotDataWork(experimentId, plotUuid, plotType));
    }
  }, [config]);

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
      <Panel header='Select data' key='15'>
        <SelectData
          config={config}
          onUpdate={updatePlotWithChanges}
          cellSets={cellSets}
          axisName='x'
        />
      </Panel>
      <Panel header='Size scale' key='absolute-scale'>
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
            description='Error loading plot data'
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
              There is no data to show.
              <br />
              Select another option from the 'Select data' menu
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
    <div style={{ paddingLeft: 32, paddingRight: 32 }}>
      <Header
        plotUuid={plotUuid}
        experimentId={experimentId}
        finalRoute={route}
      />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey='1'>
              <Panel header='Preview' key='1'>
                {renderPlot()}
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <PlotStyling
              formConfig={plotStylingControlsConfig}
              config={config}
              onUpdate={updatePlotWithChanges}
              renderExtraPanels={renderExtraPanels}
              defaultActiveKey='gene-selection'
            />
          </Space>
        </Col>
      </Row>
    </div>
  );
};

DotPlotPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default DotPlotPage;
