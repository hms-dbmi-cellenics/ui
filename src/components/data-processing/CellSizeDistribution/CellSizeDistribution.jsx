import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Collapse,
  Row,
  Col,
  List,
  Space,
  Tooltip,
  Button,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import Loader from '../../Loader';

import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from '../../../redux/actions/componentConfig';

import CellSizeDistributionHistogram from '../../plots/CellSizeDistributionHistogram';
import CellSizeDistributionKneePlot from '../../plots/CellSizeDistributionKneePlot';
import generatePlotUuid from '../../../utils/generatePlotUuid';

import PlotStyling from '../../plots/styling/PlotStyling';
import MiniPlot from '../../plots/MiniPlot';
import CalculationConfig from './CalculationConfig';

const { Panel } = Collapse;
const CellSizeDistribution = (props) => {
  const {
    experimentId, sampleId, sampleIds,
  } = props;

  const filterName = 'cellSizeDistribution';

  const allowedPlotActions = {
    export: true,
    compiled: false,
    source: false,
    editor: false,
  };

  const dispatch = useDispatch();

  const [selectedPlot, setSelectedPlot] = useState('histogram');
  const [plot, setPlot] = useState(null);

  const listData = [
    'Estimated number of cells 8672',
    'Fraction reads in cells  93.1%',
    'Mean reads per cell  93,551',
    'Median genes per cell  1,297',
    'Total genes detected   21,425',
    'Median UMI counts per cell   4,064',
  ];

  const debounceSave = useCallback(
    _.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), [],
  );

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plots[selectedPlot].plotUuid, obj));
    debounceSave(plots[selectedPlot].plotUuid);
  };

  const plots = {
    histogram: {
      title: 'Histogram',
      plotUuid: generatePlotUuid(sampleId, filterName, 0),
      plotType: 'cellSizeDistributionHistogram',
      plot: (config, plotData, actions) => (
        <CellSizeDistributionHistogram
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
    kneePlot: {
      title: 'Knee Plot',
      plotUuid: generatePlotUuid(sampleId, filterName, 1),
      plotType: 'cellSizeDistributionKneePlot',
      plot: (config, plotData, actions) => (
        <CellSizeDistributionKneePlot
          experimentId={experimentId}
          config={config}
          plotData={plotData}
          actions={actions}
        />
      ),
    },
  };

  const config = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config,
  );
  const expConfig = useSelector(
    (state) => state.experimentSettings.processing.cellSizeDistribution[sampleId]?.filterSettings
      || state.experimentSettings.processing.cellSizeDistribution.filterSettings,
  );
  const plotData = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.plotData,
  );

  useEffect(() => {
    Object.values(plots).forEach((obj) => {
      if (!config) {
        dispatch(loadPlotConfig(experimentId, obj.plotUuid, obj.plotType));
      }
    });
  }, [experimentId]);

  useEffect(() => {
    if (config && plotData && expConfig) {
      const newConfig = _.clone(config);
      _.merge(newConfig, expConfig);
      setPlot(plots[selectedPlot].plot(newConfig, plotData, allowedPlotActions));
    }
  }, [expConfig, config, plotData]);

  const plotStylingControlsConfig = [
    {
      panelTitle: 'Legend',
      controls: ['legend'],
    },
    {
      panelTitle: 'Plot Dimensions',
      controls: ['dimensions'],
    },
    {
      panelTitle: 'Axes',
      controls: ['axes'],
    },
    {
      panelTitle: 'Title',
      controls: ['title'],
    },
    {
      panelTitle: 'Font',
      controls: ['font'],
    },
  ];

  const renderPlot = () => {
    // Spinner for main window
    if (!config || !plotData) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    if (plot) {
      return plot;
    }
  };

  return (
    <>
      <Row>
        <Col span={14}>
          {renderPlot()}
        </Col>

        <Col span={5}>
          <Space direction='vertical'>
            <Tooltip title='The number of unique molecular identifiers (#UMIs) per cell distinguishes real cells (high #UMIs per cell) from empty droplets (low #UMIs per cell). Look for bimodal distribution to set the cut-off.'>
              <Button icon={<InfoCircleOutlined />} />
            </Tooltip>
            {Object.entries(plots).map(([key, plotObj]) => (
              <button
                type='button'
                key={key}
                onClick={() => setSelectedPlot(key)}
                style={{
                  margin: 0,
                  backgroundColor: 'transparent',
                  align: 'center',
                  padding: '8px',
                  border: '1px solid #000',
                  cursor: 'pointer',
                }}
              >
                <MiniPlot
                  experimentId={experimentId}
                  plotUuid={plotObj.plotUuid}
                  plotFn={plotObj.plot}
                  actions={false}
                />
              </button>

            ))}
          </Space>
          <List
            dataSource={listData}
            size='small'
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        </Col>

        <Col span={5}>
          <Collapse defaultActiveKey={['settings']}>
            <Panel header='Filtering Settings' key='settings'>
              <CalculationConfig
                experimentId={experimentId}
                sampleId={sampleId}
                plotType='bin step'
                sampleIds={sampleIds}
              />
            </Panel>
            <Panel header='Plot styling' key='styling'>
              <div style={{ height: 8 }} />
              <PlotStyling
                formConfig={plotStylingControlsConfig}
                config={config}
                onUpdate={updatePlotWithChanges}
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};

CellSizeDistribution.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
};

export default CellSizeDistribution;
