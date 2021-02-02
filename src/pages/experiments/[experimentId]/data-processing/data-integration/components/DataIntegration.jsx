import React, { useState } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import {
  Space, Row, Col,
} from 'antd';
import _ from 'lodash';

import PlotStyling from '../../filter-cells/components/PlotStyling';
import CalculationConfig from './CalculationConfig';
import ElbowPlot from './plots/ElbowPlot';

const defaultElbowPlotStylingConfig = {
  xAxisText: 'Principal Components',
  yAxisText: 'Proportion of Variance Explained',
  xDefaultTitle: 'Principal Components',
  yDefaultTitle: 'Proportion of Variance Explained',
  titleSize: 12,
  titleText: '',
  titleDx: 10,
  titleAnchor: 'start',
  masterFont: 'sans-serif',
  masterSize: 13,
  axisTitlesize: 13,
  axisTicks: 13,
  axisOffset: 0,
  transGrid: 10,
  width: 530,
  height: 400,
  maxWidth: 720,
  maxHeight: 530,
  actions: true,
  signals: [
    {
      name: 'interpolate',
      value: 'linear',
      bind: {
        input: 'select',
        options: [
          'basis',
          'cardinal',
          'catmull-rom',
          'linear',
          'monotone',
          'natural',
          'step',
          'step-after',
          'step-before',
        ],
      },
    },
  ],
};

const DataIntegration = () => {
  const plotElements = {
    elbowPlot: (configInput) => <ElbowPlot plotConfig={configInput} />,
  };

  const currentConfigs = {
    elbowPlot: defaultElbowPlotStylingConfig,
  };

  const [activePlotKey, setActivePlotKey] = useState('elbowPlot');
  const [plotConfig, setPlotConfig] = useState(currentConfigs[activePlotKey]);

  const updatePlotWithChanges = (plotConfigUpdates) => {
    const newPlotConfig = _.cloneDeep(plotConfig);
    _.merge(newPlotConfig, plotConfigUpdates);

    setPlotConfig(newPlotConfig);
  };

  const setupConfigForNavigation = (config, updatedWidth) => {
    const {
      width, height, axisTicks, ...configWithoutSize
    } = config;

    const miniPlotConfig = _.cloneDeep(configWithoutSize);

    miniPlotConfig.actions = false;
    miniPlotConfig.axisTitlesize = 5;
    miniPlotConfig.axisTicks = 5;

    miniPlotConfig.width = updatedWidth * 1.1;
    miniPlotConfig.height = updatedWidth * 0.8;
    miniPlotConfig.signals[0].bind = undefined;

    return miniPlotConfig;
  };

  const miniaturesColumn = (
    <ReactResizeDetector handleWidth handleHeight>
      {({ width: updatedWidth }) => (
        <Col span={4}>
          <Space direction='vertical' align='center' style={{ marginLeft: '0px', marginRight: '0px' }}>
            {Object.entries(currentConfigs).map(([key, config]) => (
              <button
                type='button'
                key={key}
                onClick={() => { }}// setSelectedSpec(key)}
                style={{
                  padding: 0, margin: 0, border: 0, backgroundColor: 'transparent',
                }}
              >
                {plotElements[key](setupConfigForNavigation(config, updatedWidth))}
              </button>
            ))}
          </Space>
        </Col>
      )}
    </ReactResizeDetector>
  );

  return (
    <Row>
      <Col span={14}>
        {plotElements[activePlotKey](currentConfigs[activePlotKey])}
      </Col>
      {miniaturesColumn}
      <Col span={1} />
      <Col span={5}>
        <CalculationConfig />
        <PlotStyling
          config={plotConfig}
          onUpdate={updatePlotWithChanges}
          singlePlot
        />
      </Col>
    </Row>
  );
};

export default DataIntegration;
