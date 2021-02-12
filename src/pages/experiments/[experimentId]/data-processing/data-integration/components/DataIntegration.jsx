import React, { useState, useEffect } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import {
  Row, Col, Space, Collapse, Alert,
} from 'antd';
import _ from 'lodash';
import { useRouter } from 'next/router';

import { Vega } from 'react-vega';
import CalculationConfig from './CalculationConfig';

import generateElbowSpec from '../../../../../../utils/plotSpecs/generateElbowSpec';
import fakeData from './fake_new_data.json';

import DimensionsRangeEditor from '../../../../../../components/plots/styling/DimensionsRangeEditor';
import AxesDesign from '../../../../../../components/plots/styling/AxesDesign';
import PointDesign from '../../../../../../components/plots/styling/PointDesign';
import TitleDesign from '../../../../../../components/plots/styling/TitleDesign';
import FontDesign from '../../../../../../components/plots/styling/FontDesign';
import LegendEditor from '../../../../../../components/plots/styling/LegendEditor';
import LabelsDesign from '../../../../../../components/plots/styling/LabelsDesign';
import ColourInversion from '../../../../../../components/plots/styling/ColourInversion';
import PlotStyling from '../../../../../../components/plots/styling/PlotStyling';

const defaultPlotStylingConfig = {
  legendEnabled: 'true',
  legendPosition: 'top',
  labelsEnabled: true,
  labelSize: 28,
  xAxisText: 'Principal Components',
  yAxisText: 'Proportion of Variance Explained',
  xDefaultTitle: 'Principal Components',
  yDefaultTitle: 'Proportion of Variance Explained',
  titleSize: 12,
  titleText: 'Scree plot',
  titleDx: 10,
  titleAnchor: 'start',
  masterFont: 'sans-serif',
  masterSize: 13,
  xaxisText: 'Principal Components',
  yaxisText: 'Proportion of Variance Explained',
  axisTitlesize: 13,
  axisTicks: 13,
  axisOffset: 0,
  transGrid: 10,
  width: 530,
  height: 400,
  maxWidth: 720,
  maxHeight: 530,
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
  pointSize: 5,
  pointOpa: 5,
  pointStyle: 'circle',
  toggleInvert: '#FFFFFF',
};

// This will be taken with a useSelector eventually
const persistedConfigs = {
  samplePlot: _.cloneDeep(defaultPlotStylingConfig),
  frequencyPlot: _.cloneDeep(defaultPlotStylingConfig),
  elbowPlot: _.cloneDeep(defaultPlotStylingConfig),
};

const DataIntegration = () => {
  const { Panel } = Collapse;
  const router = useRouter();
  const { experimentId } = router.query;

  const [activePlotKey, setActivePlotKey] = useState('elbowPlot');
  const [config, setCurrentConfig] = useState(persistedConfigs.elbowPlot);

  const plotElements = {
    samplePlot: (configInput, actions) => <Vega data={{ plotData: fakeData }} spec={generateElbowSpec(configInput)} renderer='canvas' actions={actions} />,
    frequencyPlot: (configInput, actions) => <Vega data={{ plotData: fakeData }} spec={generateElbowSpec(configInput)} renderer='canvas' actions={actions} />,
    elbowPlot: (configInput, actions) => <Vega data={{ plotData: fakeData }} spec={generateElbowSpec(configInput)} renderer='canvas' actions={actions} />,
  };

  const plotSpecificStyling = {
    samplePlot: [
      {
        panelTitle: 'Colours',
        controls: ['colourInversion'],
        footer: <Alert
          message='Changing plot colours is not available here. Use the Data Management tool in Data Exploration to customise cell set and metadata colours'
          type='info'
        />,
      },
      {
        panelTitle: 'Legends',
        controls: ['legend'],
      },
      {
        panelTitle: 'Markers',
        controls: ['markers'],
      },
      {
        panelTitle: 'Labels',
        controls: ['labels'],
      },
    ],
    frequencyPlot: [
      {
        panelTitle: 'Colours',
        controls: ['colourInversion'],
        footer: <Alert
          message='Changing plot colours is not available here. Use the Data Management tool in Data Exploration to customise cell set and metadata colours'
          type='info'
        />,
      },
      {
        panelTitle: 'Legends',
        controls: ['legend'],
      },
    ],
    elbowPlot: [
      {
        panelTitle: 'Colours',
        controls: ['colourInversion'],
      },
    ],
  };

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
      panelTitle: 'Axes and Margins',
      controls: ['axes'],
    },
    ...plotSpecificStyling[activePlotKey],
  ];

  useEffect(() => {
    setCurrentConfig(persistedConfigs[activePlotKey]);
  }, [activePlotKey]);

  const updatePlotWithChanges = (configUpdates) => {
    const newPlotConfig = _.cloneDeep(config);
    _.merge(newPlotConfig, configUpdates);

    setCurrentConfig(newPlotConfig);
  };

  const getMiniaturizedConfig = (miniaturesConfig, updatedWidth) => {
    const {
      width, height, axisTicks, ...configWithoutSize
    } = miniaturesConfig;

    const miniPlotConfig = _.cloneDeep(configWithoutSize);

    miniPlotConfig.axisTitlesize = 5;
    miniPlotConfig.axisTicks = 5;

    miniPlotConfig.width = updatedWidth;
    miniPlotConfig.height = updatedWidth * 0.8;
    miniPlotConfig.signals[0].bind = undefined;

    return miniPlotConfig;
  };

  const miniaturesColumn = (
    <ReactResizeDetector handleWidth handleHeight>
      {({ width: updatedWidth }) => (
        <Col span={4}>
          <Space direction='vertical' align='center' style={{ marginLeft: '0px', marginRight: '0px' }}>
            {Object.entries(persistedConfigs).map(([key, persistedConfig]) => (
              <button
                type='button'
                key={key}
                onClick={() => { setActivePlotKey(key); }}
                style={{
                  padding: 0, margin: 0, border: 0, backgroundColor: 'transparent',
                }}
              >
                {plotElements[key](getMiniaturizedConfig(persistedConfig, updatedWidth), false)}
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
        {plotElements[activePlotKey](config, true)}
      </Col>
      {miniaturesColumn}
      <Col span={1} />
      <Col span={5}>
        <Space direction='vertical' style={{ width: '100%' }}>
          <Collapse defaultActiveKey={['data-integration']}>
            <Panel header='Data Integration' key='data-integration'>
              <CalculationConfig experimentId={experimentId} />
            </Panel>
            <Panel header='Plot Styling' key='styling'>
              <div style={{ height: 8 }} />
              <PlotStyling formConfig={plotStylingConfig} config={config} onUpdate={updatePlotWithChanges} />
            </Panel>
          </Collapse>
        </Space>
      </Col>
    </Row>
  );
};

export default DataIntegration;
