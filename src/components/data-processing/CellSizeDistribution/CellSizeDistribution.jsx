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
import plot1Pic from '../../../../static/media/plot1.png';
import plot2Pic from '../../../../static/media/plot2.png';

import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from '../../../redux/actions/componentConfig';

import CellSizeDistributionHistogram from '../../plots/CellSizeDistributionHistogram';
import CellSizeDistributionKneePlot from '../../plots/CellSizeDistributionKneePlot';

import PlotStyling from '../../plots/styling/PlotStyling';
import MiniPlot from '../../plots/MiniPlot';
import CalculationConfig from './CalculationConfig';

const { Panel } = Collapse;
const CellSizeDistribution = (props) => {
  const {
    experimentId,
  } = props;

  const dispatch = useDispatch();

  const [selectedPlot, setSelectedPlot] = useState('histogram');
  const [plot, setPlot] = useState(false);

  const listData = [
    'Estimated number of cells 8672',
    'Fraction reads in cells  93.1%',
    'Mean reads per cell  93,551',
    'Median genes per cell  1,297',
    'Total genes detected   21,425',
    'Median UMI counts per cell   4,064',
  ];

  const debounceSave = useCallback(_.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), []);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plots[selectedPlot].plotUuid, obj));
    debounceSave(plots[selectedPlot].plotUuid);
  };

  const plots = {
    histogram: {
      title: 'Histogram',
      plotUuid: 'cellSizeDistributionHistogram',
      plotType: 'cellSizeDistributionHistogram',
      plot: (config, plotData, actions) => (<CellSizeDistributionHistogram experimentId={experimentId} config={config} plotData={plotData} actions={actions} />),
    },
    kneePlot: {
      title: 'Knee Plot',
      plotUuid: 'cellSizeDistributionKneePlot',
      plotType: 'cellSizeDistributionKneePlot',
      plot: (config, plotData, actions) => (<CellSizeDistributionKneePlot experimentId={experimentId} config={config} plotData={plotData} actions={actions} />),
    },
  };

  const config = useSelector((state) => state.componentConfig[plots[selectedPlot].plotUuid]?.config);
  const plotData = useSelector((state) => state.componentConfig[plots[selectedPlot].plotUuid]?.plotData);

  useEffect(() => {
    const { plotUuid, plotType } = plots[selectedPlot];

    if (!config) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }
  }, [selectedPlot]);

  useEffect(() => {
    if (config && plotData) {
      setPlot(plots[selectedPlot].plot(config, plotData));
    }
  }, [config, plotData]);

  const plotStylingConfig = [
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
                <MiniPlot experimentId={experimentId} plotUuid={plotObj.plotUuid} plotFn={plotObj.plot} actions={false} />
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
              <CalculationConfig experimentId={experimentId} />
            </Panel>
            <Panel header='Plot styling' key='styling'>
              <div style={{ height: 8 }} />
              <PlotStyling formConfig={plotStylingConfig} config={config} onUpdate={updatePlotWithChanges} />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};

CellSizeDistribution.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default CellSizeDistribution;
