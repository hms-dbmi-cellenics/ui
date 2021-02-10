import React, { useState, useEffect } from 'react';

import { useSelector, useDispatch } from 'react-redux';

import ReactResizeDetector from 'react-resize-detector';
import {
  Row, Col, Space, Collapse, Alert, Spin,
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

import isBrowser from '../../../../../../utils/environment';

import loadCellSets from '../../../../../../redux/actions/cellSets/loadCellSets';

// TODO This loadPlotConfig should probably be changed on the redux ticket? because it fetches in a url that seems dedicated to plots and tables:
// ${getApiEndpoint()}/v1/experiments/${experimentId}/plots-tables/${plotUuid}
import {
  loadPlotConfig,
} from '../../../../../../redux/actions/componentConfig/index';

import CalculationConfig from './CalculationConfig';
import fakeData from './fake_new_data.json';

import FrequencyPlot from '../../../../../../utils/sharedPlots/FrequencyPlot';
import ElbowPlot from './plots/ElbowPlot';

const defaultElbowPlotStylingConfig = {
  legend: {
    enabled: 'true',
    position: 'top',
  },
  label: {
    enabled: true,
    size: 28,
  },
  dimensions: {
    width: 530,
    height: 400,
    maxWidth: 720,
    maxHeight: 530,
  },
  marker: {
    shape: 'circle',
    opacity: 5,
    size: 5,
  },
  axes: {
    xAxisText: 'Principal Components',
    yAxisText: 'Proportion of Variance Explained',
    titleFont: 'sans-serif',
    labelFont: 'sans-serif',
    titleFontSize: 13,
    labelFontSize: 13,
    offset: 0,
    gridOpacity: 10,
  },
  colour: {
    toggleInvert: '#FFFFFF',
  },
  title: {
    text: '',
    anchor: 'start',
    font: 'sans-serif',
    fontSize: 12,
    dx: 10,
  },
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

const frequencyPlotConfigRedux = {
  uuid: 'dataIntegrationFrequency',
  type: 'dataIntegrationFrequency',
};

const DataIntegration = () => {
  const { Panel } = Collapse;

  const dispatch = useDispatch();
  const router = useRouter();
  const { experimentId } = router.query;

  // This will be taken with a useSelector eventually
  const persistedConfigs = {
    samplePlot: _.cloneDeep(defaultElbowPlotStylingConfig),
    frequencyPlot: useSelector(
      (state) => state.componentConfig[frequencyPlotConfigRedux.uuid]?.config,
    ),
    elbowPlot: _.cloneDeep(defaultElbowPlotStylingConfig),
  };

  const [activePlotKey, setActivePlotKey] = useState('frequencyPlot');
  const config = persistedConfigs[activePlotKey];

  const setCurrentConfig = () => {
    // This will be used for dispatching the config updates to redux
  };

  const cellSets = useSelector((state) => state.cellSets);
  const {
    hierarchy, properties,
  } = cellSets;

  const renderIfAvailable = (renderFunc, loadingElement) => {
    if (!loadingElement || !isBrowser) {
      return (
        <Spin size='large' />
      );
    }

    return renderFunc(loadingElement);
  };

  const plots = {
    samplePlot: (configInput, actions) => (
      <ElbowPlot config={configInput} plotData={fakeData} actions={actions} />
    ),
    frequencyPlot: (configInput, actions) => (
      <FrequencyPlot
        config={configInput}
        hierarchy={hierarchy}
        properties={properties}
        actions={actions}
      />
    ),
    elbowPlot: (configInput, actions) => (
      <ElbowPlot config={configInput} plotData={fakeData} actions={actions} />
    ),
  };

  useEffect(() => {
    if (!experimentId || !isBrowser) {
      return;
    }

    dispatch(loadCellSets(experimentId));
    dispatch(
      loadPlotConfig(experimentId, frequencyPlotConfigRedux.uuid, frequencyPlotConfigRedux.type),
    );
  }, [experimentId]);

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
            config={config}
            option='top-bottom'
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
            config={config}
            option='top-bottom'
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

    miniPlotConfig.axes.titleFontSize = 5;
    miniPlotConfig.axes.labelFontSize = 5;

    miniPlotConfig.dimensions.width = updatedWidth;
    miniPlotConfig.dimensions.height = updatedWidth * 0.8;

    miniPlotConfig.legend.enabled = false;

    if (miniPlotConfig.signals) { miniPlotConfig.signals[0].bind = undefined; }

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
                {
                  renderIfAvailable(
                    (loadedConfig) => (
                      plots[key](getMiniaturizedConfig(loadedConfig, updatedWidth), false)
                    ),
                    persistedConfig,
                  )
                }
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
        {renderIfAvailable((loadedConfig) => plots[activePlotKey](loadedConfig, true), config)}
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
