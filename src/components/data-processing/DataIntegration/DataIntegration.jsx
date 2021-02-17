import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactResizeDetector from 'react-resize-detector';
import {
  Row, Col, Space, Collapse, Alert, Spin,
} from 'antd';
import _ from 'lodash';
import { useRouter } from 'next/router';

import CalculationConfig from './CalculationConfig';

import { loadProcessingSettings } from '../../../redux/actions/experimentSettings';

import DimensionsRangeEditor from '../../plot-styling/DimensionsRangeEditor';
import AxesDesign from '../../plot-styling/AxesDesign';
import PointDesign from '../../plot-styling/PointDesign';
import TitleDesign from '../../plot-styling/TitleDesign';
import FontDesign from '../../plot-styling/FontDesign';
import LegendEditor from '../../plot-styling/LegendEditor';
import LabelsDesign from '../../plot-styling/LabelsDesign';
import ColourInversion from '../../plot-styling/ColourInversion';

import loadCellSets from '../../../redux/actions/cellSets/loadCellSets';

import PlatformError from '../../PlatformError';

import {
  loadPlotConfig,
} from '../../../redux/actions/componentConfig/index';

import fakeData from './fake_new_data.json';

import CategoricalEmbeddingPlot from '../../plots/CategoricalEmbeddingPlot';
import FrequencyPlot from '../../plots/FrequencyPlot';
import ElbowPlot from '../../plots/ElbowPlot';

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
    width: 700,
    height: 550,
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

const samplePlotConfigRedux = {
  uuid: 'dataIntegrationEmbedding',
  type: 'dataIntegrationEmbedding',
};

const DataIntegration = () => {
  const { Panel } = Collapse;

  const dispatch = useDispatch();
  const router = useRouter();
  const { experimentId } = router.query;

  const [activePlotKey, setActivePlotKey] = useState('samplePlot');
  const cellSets = useSelector((state) => state.cellSets);

  const {
    loading, error, hierarchy, properties,
  } = cellSets;

  const calculationConfig = useSelector(
    (state) => state.experimentSettings.processing.dataIntegration,
  );

  const persistedConfigs = {
    samplePlot: useSelector((state) => state.componentConfig[samplePlotConfigRedux.uuid]?.config),
    frequencyPlot: useSelector(
      (state) => (state.componentConfig[frequencyPlotConfigRedux.uuid]?.config),
    ),
    elbowPlot: _.cloneDeep(defaultElbowPlotStylingConfig),
  };

  const renderIfAvailable = (renderFunc, elementToRender) => {
    if (!elementToRender || loading) {
      return (
        <Spin size='large' />
      );
    }

    if (error) {
      return (
        <PlatformError
          description={error}
          onClick={() => loadCellSets(experimentId)}
        />
      );
    }

    return renderFunc(elementToRender);
  };

  const activeConfig = persistedConfigs[activePlotKey];

  const plots = {
    samplePlot: (configInput, actions) => (
      <CategoricalEmbeddingPlot
        experimentId={experimentId}
        config={configInput}
        actions={actions}
      />
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
    if (!calculationConfig) {
      dispatch(loadProcessingSettings(experimentId));
    }

    dispatch(loadCellSets(experimentId));

    dispatch(
      loadPlotConfig(experimentId, samplePlotConfigRedux.uuid, samplePlotConfigRedux.type),
    );

    dispatch(
      loadPlotConfig(experimentId, frequencyPlotConfigRedux.uuid, frequencyPlotConfigRedux.type),
    );
  }, [experimentId]);

  const plotSpecificStyling = {
    samplePlot: () => (
      <>
        <Panel header='Colours' key='colors'>
          <ColourInversion
            config={activeConfig}
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
            config={activeConfig}
            option='top-bottom'
          />
        </Panel>
        <Panel header='Markers' key='marker'>
          <PointDesign config={activeConfig} onUpdate={updatePlotWithChanges} />
        </Panel>
        <Panel header='Labels' key='labels'>
          <LabelsDesign config={activeConfig} onUpdate={updatePlotWithChanges} />
        </Panel>
      </>
    ),
    frequencyPlot: () => (
      <>
        <Panel header='Colours' key='colors'>
          <ColourInversion
            config={activeConfig}
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
            config={activeConfig}
            option='top-bottom'
          />
        </Panel>
      </>
    ),
    elbowPlot: () => (
      <>
        <Panel header='Colours' key='colors'>
          <ColourInversion
            config={activeConfig}
            onUpdate={updatePlotWithChanges}
          />
        </Panel>
      </>
    ),
  };

  const updatePlotWithChanges = (configUpdates) => {
    const newPlotConfig = _.cloneDeep(activeConfig);
    _.merge(newPlotConfig, configUpdates);
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

    if (miniPlotConfig.label) {
      miniPlotConfig.label.enabled = false;
    }

    if (miniPlotConfig.marker.size) {
      miniPlotConfig.marker.size = 1;
    }

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
        {renderIfAvailable(
          (loadedConfig) => plots[activePlotKey](loadedConfig, true), activeConfig,
        )}
      </Col>
      {miniaturesColumn}
      <Col span={1} />
      <Col span={5}>
        <Collapse defaultActiveKey={['data-integration']}>
          <Panel header='Data Integration' key='data-integration'>
            <CalculationConfig experimentId={experimentId} config={calculationConfig} />
          </Panel>
          <Panel header='Plot Styling' key='styling'>
            <Collapse accordion>
              <Panel header='Main Schema' key='main-schema'>
                <DimensionsRangeEditor
                  config={activeConfig}
                  onUpdate={updatePlotWithChanges}
                />
                <Collapse accordion>
                  <Panel header='Define and Edit Title' key='title'>
                    <TitleDesign
                      config={activeConfig}
                      onUpdate={updatePlotWithChanges}
                    />
                  </Panel>
                  <Panel header='Font' key='font'>
                    <FontDesign
                      config={activeConfig}
                      onUpdate={updatePlotWithChanges}
                    />
                  </Panel>
                </Collapse>
              </Panel>
              <Panel header='Axes and Margins' key='axes'>
                <AxesDesign config={activeConfig} onUpdate={updatePlotWithChanges} />
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
