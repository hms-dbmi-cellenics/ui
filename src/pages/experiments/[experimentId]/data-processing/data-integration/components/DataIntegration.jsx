import React, { useState, useEffect } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import {
  Row, Col, Space, Collapse, Alert,
} from 'antd';
import _ from 'lodash';
import { useRouter } from 'next/router';

import DimensionsRangeEditor from '../../../plots-and-tables/components/DimensionsRangeEditor';
import AxesDesign from '../../../plots-and-tables/components/AxesDesign';
import PointDesign from '../../../plots-and-tables/components/PointDesign';
import TitleDesign from '../../../plots-and-tables/components/TitleDesign';
import FontDesign from '../../../plots-and-tables/components/FontDesign';
import LegendEditor from '../../../plots-and-tables/components/LegendEditor';
import LabelsDesign from '../../../plots-and-tables/components/LabelsDesign';
import ColourInversion from '../../../plots-and-tables/components/ColourInversion';

import CalculationConfig from './CalculationConfig';
import fakeData from './fake_new_data.json';

import ElbowPlot from './plots/ElbowPlot';

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

  const plots = {
    samplePlot: (configInput, actions) => <ElbowPlot config={configInput} plotData={fakeData} actions={actions} />,
    frequencyPlot: (configInput, actions) => <ElbowPlot config={configInput} plotData={fakeData} actions={actions} />,
    elbowPlot: (configInput, actions) => <ElbowPlot config={configInput} plotData={fakeData} actions={actions} />,
  };

  // const plotElements = {
  //   samplePlot: (configInput, actions) => <Vega data={{ plotData: fakeData }} spec={generateElbowSpec(configInput)} renderer='canvas' actions={actions} />,
  //   frequencyPlot: (configInput, actions) => <Vega data={{ plotData: fakeData }} spec={generateElbowSpec(configInput)} renderer='canvas' actions={actions} />,
  //   elbowPlot: (configInput, actions) => <Vega data={{ plotData: fakeData }} spec={generateElbowSpec(configInput)} renderer='canvas' actions={actions} />,
  // };

  const plotSpecificStyling = {
    samplePlot: () => (
      <>
        <Panel header='Colours' key='colors'>
          <ColourInversion
            config={config}
            onUpdate={updatePlotWithChanges}
          />
          <Alert
            message='Changing plot colours is not available here. Use the Data Management tool in Data Exploration to customise cell set and metadata colours'
            type='info'
          />
        </Panel>

        <Panel header='Legend' key='legend'>
          <LegendEditor
            onUpdate={updatePlotWithChanges}
            legendEnabled={config.legendEnabled}
            legendPosition={config.legendPosition}
            legendOptions='top-bot'
          />
        </Panel>
        <Panel header='Markers' key='marker'>
          <PointDesign config={config} onUpdate={updatePlotWithChanges} />
        </Panel>
        <Panel header='Labels' key='labels'>
          <LabelsDesign config={config} onUpdate={updatePlotWithChanges} />
        </Panel>
      </>
    ),
    frequencyPlot: () => (
      <>
        <Panel header='Colours' key='colors'>
          <ColourInversion
            config={config}
            onUpdate={updatePlotWithChanges}
          />
          <Alert
            message='Changing plot colours is not available here. Use the Data Management tool in Data Exploration to customise cell set and metadata colours'
            type='info'
          />
        </Panel>
        <Panel header='Legend' key='legend'>
          <LegendEditor
            onUpdate={updatePlotWithChanges}
            legendEnabled={config.legendEnabled}
            legendPosition={config.legendPosition}
            legendOptions='top-bot'
          />
        </Panel>
      </>
    ),
    elbowPlot: () => (
      <>
        <Panel header='Colours' key='colors'>
          <ColourInversion
            config={config}
            onUpdate={updatePlotWithChanges}
          />
        </Panel>
      </>
    ),
  };

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
                {plots[key](getMiniaturizedConfig(persistedConfig, updatedWidth), false)}
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
        {plots[activePlotKey](config, true)}
      </Col>
      {miniaturesColumn}
      <Col span={1} />
      <Col span={5}>
        <Collapse defaultActiveKey={['data-integration']}>
          <Panel header='Data Integration' key='data-integration'>
            <CalculationConfig experimentId={experimentId} />
          </Panel>
          <Panel header='Plot Styling' key='styling'>
            <Collapse accordion>
              <Panel header='Main Schema' key='main-schema'>
                <DimensionsRangeEditor
                  config={config}
                  onUpdate={updatePlotWithChanges}
                />
                <Collapse accordion>
                  <Panel header='Define and Edit Title' key='title'>
                    <TitleDesign
                      config={config}
                      onUpdate={updatePlotWithChanges}
                    />
                  </Panel>
                  <Panel header='Font' key='font'>
                    <FontDesign
                      config={config}
                      onUpdate={updatePlotWithChanges}
                    />
                  </Panel>
                </Collapse>
              </Panel>
              <Panel header='Axes and Margins' key='axes'>
                <AxesDesign config={config} onUpdate={updatePlotWithChanges} />
              </Panel>
              {plotSpecificStyling[activePlotKey]()}
            </Collapse>
          </Panel>
        </Collapse>
      </Col>
    </Row>
  );
};

export default DataIntegration;
