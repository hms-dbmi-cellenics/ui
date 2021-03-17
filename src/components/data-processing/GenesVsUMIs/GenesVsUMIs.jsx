import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Collapse, Row, Col, Space, Button, Tooltip,
  List,
  InputNumber, Select, Slider, Form,
} from 'antd';
import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import Loader from '../../Loader';
import plot1Pic from '../../../../static/media/plot7.png';
import plot2Pic from '../../../../static/media/plot8.png';

import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from '../../../redux/actions/componentConfig';

import FeaturesVsUMIsHistogram from '../../plots/FeaturesVsUMIsHistogram';
import FeaturesVsUMIsScatterplot from '../../plots/FeaturesVsUMIsScatterplot';

import PlotStyling from '../../plots/styling/PlotStyling';
import MiniPlot from '../../plots/MiniPlot';
import CalculationConfig from './CalculationConfig';

const { Panel } = Collapse;

const GenesVsUMIs = (props) => {
  const {
    experimentId,
  } = props;

  const dispatch = useDispatch();

  const [selectedPlot, setSelectedPlot] = useState('histogram');
  const [plot, setPlot] = useState(false);

  const debounceSave = useCallback(_.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), []);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plots[selectedPlot].plotUuid, obj));
    debounceSave(plots[selectedPlot].plotUuid);
  };

  const plots = {
    histogram: {
      title: 'Histogram',
      imgSrc: plot1Pic,
      plotUuid: 'featuresVsUMIsHistogram',
      plotType: 'featuresVsUMIsHistogram',
      plot: (config, plotData, actions) => (<FeaturesVsUMIsHistogram experimentId={experimentId} config={config} plotData={plotData} actions={actions} />),
    },
    scatterplot: {
      title: 'Knee Plot',
      imgSrc: plot2Pic,
      plotUuid: 'featuresVsUMIsScatterplot',
      plotType: 'featuresVsUMIsScatterplot',
      plot: (config, plotData, actions) => (<FeaturesVsUMIsScatterplot experimentId={experimentId} config={config} plotData={plotData} actions={actions} />),
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
          <Space direction='vertical' style={{ width: '100%' }}>
            <Tooltip placement='bottom' title='The number of genes vs number of UMIs plot is used to exclude cell fragments and outliers. The user can set the stringency (to define the confidence band), and the min/max cell size (note that min cell size will change across filters).'>
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

GenesVsUMIs.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default GenesVsUMIs;
