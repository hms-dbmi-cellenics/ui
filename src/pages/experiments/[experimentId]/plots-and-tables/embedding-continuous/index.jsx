/* eslint-disable no-param-reassign */
import React, { useEffect, useRef } from 'react';
import {
  Row, Col, Space, Collapse, Spin, Skeleton, Input,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import _ from 'lodash';
import { useRouter } from 'next/router';
import DimensionsRangeEditor from '../components/DimensionsRangeEditor';
import ColourbarDesign from '../components/ColourbarDesign';
import ColourInversion, { invertColour } from '../components/ColourInversion';
import LogExpression from './components/LogExpression';
import AxesDesign from '../components/AxesDesign';
import PointDesign from '../components/PointDesign';
import TitleDesign from '../components/TitleDesign';
import FontDesign from '../components/FontDesign';
import LegendEditor from '../components/LegendEditor';
import SelectData from './components/SelectData';
import {
  updatePlotConfig,
  loadPlotConfig,
} from '../../../../../redux/actions/componentConfig/index';
import { loadGeneExpression } from '../../../../../redux/actions/genes';
import { loadEmbedding } from '../../../../../redux/actions/embedding';
import { generateSpec } from '../../../../../utils/plotSpecs/generateEmbeddingContinuousSpec';
import { initialPlotConfigStates } from '../../../../../redux/reducers/componentConfig/initialState';
import Header from '../components/Header';
import isBrowser from '../../../../../utils/environment';
import PlatformError from '../../../../../components/PlatformError';
import loadCellSets from '../../../../../redux/actions/cellSets/loadCellSets';

const { Panel } = Collapse;
const { Search } = Input;

const route = {
  path: 'embedding-continuous',
  breadcrumbName: 'Continuous Embedding',
};

// TODO: when we want to enable users to create their custom plots,
// we will need to change this to proper Uuid
const plotUuid = 'embeddingContinuousMain';
const plotType = 'embeddingContinuous';
const embeddingType = 'umap';
const defaultShownGene = initialPlotConfigStates[plotType].shownGene;

const EmbeddingContinuousPlot = () => {
  const selectedGene = useRef(defaultShownGene);

  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const expressionLoading = useSelector(
    (state) => state.genes.expression.loading,
  );
  const selectedExpression = useSelector(
    (state) => state.genes.expression.data[selectedGene.current],
  );
  const expressionError = useSelector((state) => state.genes.expression.error);
  const { data, loading, error } = useSelector((state) => state.embeddings[embeddingType]) || {};
  const cellSets = useSelector((state) => state.cellSets);
  const { properties } = cellSets;

  const router = useRouter();
  const { experimentId } = router.query;

  useEffect(() => {
    if (!experimentId || !isBrowser) {
      return;
    }
    if (!data) {
      dispatch(loadEmbedding(experimentId, embeddingType));
    }
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    if (!selectedExpression) {
      dispatch(loadGeneExpression(experimentId, [selectedGene.current]));
    }
    dispatch(loadCellSets(experimentId));
  }, [experimentId]);

  // obj is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const filterSamples = () => {
    if (config.selectedSample === 'All') {
      return data;
    }
    const cellIds = Array.from(properties[config.selectedSample].cellIds);
    const filteredData = data.filter((id) => cellIds.includes(data.indexOf(id)));
    return filteredData;
  };
  const generateVegaData = () => ({
    expression: selectedExpression,
    embedding: _.cloneDeep(filterSamples()),
  });

  if (!config) {
    return <Skeleton />;
  }

  const changeDislayedGene = (geneName) => {
    updatePlotWithChanges({ shownGene: geneName });
    selectedGene.current = geneName;
    dispatch(loadGeneExpression(experimentId, [geneName]));
  };

  const renderPlot = () => {
    // The embedding couldn't load. Display an error condition.
    if (expressionError) {
      return (
        <PlatformError
          description={expressionError}
          onClick={() => dispatch(loadGeneExpression(experimentId, [selectedGene.current]))}
        />
      );
    }

    if (error) {
      return (
        <PlatformError
          description={error}
        />
      );
    }
    if (cellSets.error) {
      return (
        <PlatformError
          description={cellSets.error}
          onClick={() => dispatch(loadCellSets(experimentId))}
        />
      );
    }

    if (
      !config
      || !data
      || loading
      || !isBrowser
      || expressionLoading.includes(selectedGene.current)
      || cellSets.loading
    ) {
      return (
        <center>
          <Spin size='large' />
        </center>
      );
    }

    return (
      <center>
        <Vega
          spec={generateSpec(config, selectedGene)}
          data={generateVegaData()}
          renderer='canvas'
        />
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
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Preview' key='1'>
                {renderPlot()}
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }} />
          <Collapse accordion>
            <Panel header='Gene Selection' key='666'>
              <Search
                style={{ width: '100%' }}
                enterButton='Search'
                defaultValue={selectedGene.current}
                onSearch={(val) => changeDislayedGene(val)}
              />
            </Panel>
            <Panel header='Select Data' key='15'>
              <SelectData
                config={config}
                onUpdate={updatePlotWithChanges}
                cellSets={cellSets}
              />
            </Panel>
            <Panel header='Log Transformation' key='5'>
              <LogExpression config={config} onUpdate={updatePlotWithChanges} />
            </Panel>
            <Panel header='Main Schema' key='2'>
              <DimensionsRangeEditor
                width={config.dimensions.width}
                height={config.dimensions.height}
                onWidthUpdate={(val) => updatePlotWithChanges({ dimensions: { width: val } })}
                onHeightUpdate={(val) => updatePlotWithChanges({ dimensions: { height: val } })}
              />
              <Panel header='Define and Edit Title' key='6'>
                <TitleDesign
                  title={config.title.text}
                  fontSize={config.title.fontSize}
                  anchor={config.title.anchor}
                  onTitleUpdate={(e) => updatePlotWithChanges({ title: { text: e.target.value } })}
                  onFontSizeUpdate={(val) => updatePlotWithChanges({ title: { fontSize: val } })}
                  onAnchorUpdate={(e) => updatePlotWithChanges({ title: { anchor: e.target.value } })}
                />
              </Panel>
              <Panel header='Font' key='9'>
                <FontDesign
                  font={config.fontStyle.font}
                  onUpdate={(e) => updatePlotWithChanges({ fontStyle: { font: e.target.value } })}
                />
              </Panel>
            </Panel>
            <Panel header='Axes and Margins' key='3'>
              <AxesDesign
                xAxisText={config.axes.xAxisText}
                yAxisText={config.axes.yAxisText}
                labelSize={config.axes.labelSize}
                tickSize={config.axes.tickSize}
                offset={config.axes.offset}
                gridLineWeight={config.axes.gridLineWeight}
                onXAxisTextUpdate={(e) => updatePlotWithChanges({ axes: { xAxisText: e.target.value } })}
                onYAxisTextUpdate={(e) => updatePlotWithChanges({ axes: { yAxisText: e.target.value } })}
                onLabelSizeUpdate={(val) => updatePlotWithChanges({ axes: { labelSize: val } })}
                onTickSizeUpdate={(val) => updatePlotWithChanges({ axes: { tickSize: val } })}
                onOffsetUpdate={(val) => updatePlotWithChanges({ axes: { offset: val } })}
                onGridLineWeightUpdate={(val) => updatePlotWithChanges({ axes: { gridLineWeight: val } })}
              />
            </Panel>
            <Panel header='Colours' key='10'>
              <ColourbarDesign
                value={config.colour.gradient}
                onUpdate={(e) => updatePlotWithChanges({ colour: { gradient: e.target.value } })}
              />
              <ColourInversion
                value={config.colour.toggleInvert}
                onUpdate={(e) => updatePlotWithChanges(invertColour(e.target.value))}
              />
            </Panel>
            <Panel header='Markers' key='11'>
              <PointDesign
                shape={config.marker.shape}
                size={config.marker.size}
                opacity={config.marker.opacity}
                onShapeUpdate={(e) => updatePlotWithChanges({ marker: { shape: e.target.value } })}
                onSizeUpdate={(val) => updatePlotWithChanges({ marker: { size: val } })}
                onOpacityUpdate={(val) => updatePlotWithChanges({ marker: { opacity: val } })}
              />
            </Panel>
            <Panel header='Legend' key='12'>
              <LegendEditor
                onEnabledUpdate={(e) => updatePlotWithChanges({ legend: { enabled: e.target.value } })}
                onValueUpdate={(e) => updatePlotWithChanges({ legend: { position: e.target.value } })}
                enabled={config.legend.enabled}
                position={config.legend.position}
                option={{ positions: 'corners' }}
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default EmbeddingContinuousPlot;
