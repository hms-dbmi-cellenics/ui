import React, {
  useState, useEffect, useCallback, useRef,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactResizeDetector from 'react-resize-detector';
import {
  Row, Col, Space, Collapse, Alert,
} from 'antd';
import _ from 'lodash';
import { useRouter } from 'next/router';

import CalculationConfig from './CalculationConfig';

import { loadProcessingSettings } from '../../../redux/actions/experimentSettings';

import DimensionsRangeEditor from '../../plots/styling/DimensionsRangeEditor';
import AxesDesign from '../../plots/styling/AxesDesign';
import PointDesign from '../../plots/styling/PointDesign';
import TitleDesign from '../../plots/styling/TitleDesign';
import FontDesign from '../../plots/styling/FontDesign';
import LegendEditor from '../../plots/styling/LegendEditor';
import LabelsDesign from '../../plots/styling/LabelsDesign';
import ColourInversion from '../../plots/styling/ColourInversion';

import loadCellSets from '../../../redux/actions/cellSets/loadCellSets';

import PlatformError from '../../PlatformError';

import { loadPlotConfig } from '../../../redux/actions/componentConfig';

import fakeData from './fake_new_data.json';

import CategoricalEmbeddingPlot from '../../plots/CategoricalEmbeddingPlot';
import FrequencyPlot from '../../plots/FrequencyPlot';
import ElbowPlot from '../../plots/ElbowPlot';
import Loader from '../../Loader';

const samplePlotConfigRedux = {
  uuid: 'dataIntegrationEmbedding',
  type: 'dataIntegrationEmbedding',
};

const frequencyPlotConfigRedux = {
  uuid: 'dataIntegrationFrequency',
  type: 'dataIntegrationFrequency',
};

const elbowPlotConfigRedux = {
  uuid: 'dataIntegrationElbow',
  type: 'dataIntegrationElbow',
};

const DataIntegration = () => {
  const { Panel } = Collapse;

  const dispatch = useDispatch();
  const router = useRouter();
  const { experimentId } = router.query;

  const [activePlotKey, setActivePlotKey] = useState('samplePlot');
  const activePlotKeyRef = useRef();
  activePlotKeyRef.current = activePlotKey;

  const cellSets = useSelector((state) => state.cellSets);

  const {
    loading, error, hierarchy, properties,
  } = cellSets;

  const calculationConfig = useSelector(
    (state) => state.experimentSettings.processing.dataIntegration,
  );

  const samplePlotPersistedConfig = useSelector(
    (state) => state.componentConfig[samplePlotConfigRedux.uuid]?.config,
  );
  const frequencyPlotPersistedConfig = useSelector(
    (state) => (state.componentConfig[frequencyPlotConfigRedux.uuid]?.config),
  );
  const elbowPlotPersistedConfig = useSelector(
    (state) => (state.componentConfig[elbowPlotConfigRedux.uuid]?.config),
  );

  const updatePlotWithChanges = (configUpdates) => {
    const { plotUuid } = plots[activePlotKeyRef.current];

    dispatch(updatePlotConfig(plotUuid, configUpdates));
    debounceSave(plotUuid);
  };

  const plots = {
    samplePlot: {
      plotUuid: samplePlotConfigRedux.uuid,
      renderPlot: (configInput, actions) => (
        <CategoricalEmbeddingPlot
          experimentId={experimentId}
          config={configInput}
          actions={actions}
        />
      ),
      persistedConfig: samplePlotPersistedConfig,
      specificStylingOptions: () => (
        <>
          <Panel header='Colours' key='colors'>
            <ColourInversion
              config={samplePlotPersistedConfig}
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
              config={samplePlotPersistedConfig}
              option={{ positions: 'top-bottom' }}
            />
          </Panel>
          <Panel header='Markers' key='marker'>
            <PointDesign config={samplePlotPersistedConfig} onUpdate={updatePlotWithChanges} />
          </Panel>
          <Panel header='Labels' key='labels'>
            <LabelsDesign config={samplePlotPersistedConfig} onUpdate={updatePlotWithChanges} />
          </Panel>
        </>
      ),
    },
    frequencyPlot: {
      plotUuid: frequencyPlotConfigRedux.uuid,
      renderPlot: (configInput, actions) => (
        <FrequencyPlot
          config={configInput}
          hierarchy={hierarchy}
          properties={properties}
          actions={actions}
        />
      ),
      persistedConfig: frequencyPlotPersistedConfig,
      specificStylingOptions: () => (
        <>
          <Panel header='Colours' key='colors'>
            <ColourInversion
              config={frequencyPlotPersistedConfig}
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
              config={frequencyPlotPersistedConfig}
              option={{ positions: 'top-bottom' }}
            />
          </Panel>
        </>
      ),
    },
    elbowPlot: {
      plotUuid: elbowPlotConfigRedux.uuid,
      renderPlot: (stylingConfig, actions) => (
        <ElbowPlot
          stylingConfig={stylingConfig}
          calculationConfig={calculationConfig}
          plotData={fakeData}
          actions={actions}
        />
      ),
      persistedConfig: elbowPlotPersistedConfig,
      specificStylingOptions: () => (
        <>
          <Panel header='Colours' key='colors'>
            <ColourInversion
              config={elbowPlotPersistedConfig}
              onUpdate={updatePlotWithChanges}
            />
          </Panel>
        </>
      ),
    },
  };

  const activeConfig = plots[activePlotKey].persistedConfig;

  useEffect(() => {
    if (!calculationConfig) {
      dispatch(loadProcessingSettings(experimentId));
    }

    dispatch(loadCellSets(experimentId));

    if (!samplePlotPersistedConfig) {
      dispatch(
        loadPlotConfig(experimentId, samplePlotConfigRedux.uuid, samplePlotConfigRedux.type),
      );
    }

    if (!frequencyPlotPersistedConfig) {
      dispatch(
        loadPlotConfig(experimentId, frequencyPlotConfigRedux.uuid, frequencyPlotConfigRedux.type),
      );
    }

    if (!elbowPlotPersistedConfig) {
      dispatch(
        loadPlotConfig(experimentId, elbowPlotConfigRedux.uuid, elbowPlotConfigRedux.type),
      );
    }
  }, [experimentId]);

  const debounceSave = useCallback(
    _.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), [],
  );

  const renderIfAvailable = (renderFunc, elementToRender) => {
    if (!elementToRender || loading) {
      return (
        <Loader experimentId={experimentId} />
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

    miniPlotConfig.title.fontSize = 5;

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
            {Object.entries(plots).map(([key, value]) => (
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
                      plots[key].renderPlot(
                        getMiniaturizedConfig(loadedConfig, updatedWidth),
                        false,
                      )
                    ),
                    value.persistedConfig,
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
          (loadedConfig) => plots[activePlotKey].renderPlot(loadedConfig, true), activeConfig,
        )}
      </Col>
      {miniaturesColumn}
      <Col span={1} />
      <Col span={5}>
        <Collapse defaultActiveKey={['data-integration']}>
          <Panel header='Data Integration' key='data-integration'>
            <CalculationConfig
              experimentId={experimentId}
              config={calculationConfig}
              data={fakeData}
            />
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
              {plots[activePlotKey].specificStylingOptions()}
            </Collapse>
          </Panel>
        </Collapse>
      </Col>
    </Row>
  );
};

export default DataIntegration;
