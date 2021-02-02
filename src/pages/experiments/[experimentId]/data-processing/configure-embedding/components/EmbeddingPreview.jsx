import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Row, Col, Space, Button, Tooltip, PageHeader, Spin, Collapse,
} from 'antd';

import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import _ from 'lodash';
import { Vega } from 'react-vega';
import plot1Pic from '../../../../../../../static/media/plot9.png';
import plot2Pic from '../../../../../../../static/media/plot10.png';
import CalculationConfig from './CalculationConfig';
import UMAP from './new_data.json';

import PlatformError from '../../../../../../components/PlatformError';
import { initialPlotConfigStates } from '../../../../../../redux/reducers/componentConfig/initialState';
import generateEmbeddingCategoricalSpec from '../../../../../../utils/plotSpecs/generateEmbeddingCategoricalSpec';
import generateEmbeddingContinuousSpec from '../../../../../../utils/plotSpecs/generateEmbeddingContinuousSpec';
import colorProvider from '../../../../../../utils/colorProvider';
import DimensionsRangeEditor from '../../../plots-and-tables/components/DimensionsRangeEditor';
import ColourbarDesign from '../../../plots-and-tables/components/ColourbarDesign';
import ColourInversion, { invertColour } from '../../../plots-and-tables/components/ColourInversion';
import AxesDesign from '../../../plots-and-tables/components/AxesDesign';
import PointDesign from '../../../plots-and-tables/components/PointDesign';
import TitleDesign from '../../../plots-and-tables/components/TitleDesign';
import FontDesign from '../../../plots-and-tables/components/FontDesign';
import LegendEditor from '../../../plots-and-tables/components/LegendEditor';
import LabelsDesign from '../../../plots-and-tables/components/LabelsDesign';

const { Panel } = Collapse;

const EmbeddingPreview = () => {
  const router = useRouter();
  const { experimentId } = router.query;
  const [selectedSpec, setSelectedSpec] = useState('sample');
  const [plotSpec, setPlotSpec] = useState({});
  const [config, setConfig] = useState(null);

  const error = false;

  const plots = {
    sample: {
      title: 'Samples',
      initialConfig: initialPlotConfigStates.embeddingCategorical,
      specGenerator: generateEmbeddingCategoricalSpec,
      imgSrc: plot1Pic,
      plotUuid: 'embeddingContinuousMain',
      plotType: 'embeddingContinuous',
    },
    cellCluster: {
      title: 'Default clusters',
      initialConfig: initialPlotConfigStates.embeddingCategorical,
      specGenerator: generateEmbeddingCategoricalSpec,
      imgSrc: plot1Pic,
      plotUuid: 'embeddingContinuousMain',
      plotType: 'embeddingContinuous',
    },
    mitochondrialFraction: {
      title: 'Mitochondrial fraction reads',
      initialConfig: initialPlotConfigStates.embeddingContinuous,
      specGenerator: generateEmbeddingContinuousSpec,
      imgSrc: plot2Pic,
      plotUuid: 'embeddingCategoricalMain',
      plotType: 'embeddingCategorical',
    },
    doubletScore: {
      title: 'Cell doublet score',
      initialConfig: initialPlotConfigStates.embeddingContinuous,
      specGenerator: generateEmbeddingContinuousSpec,
      imgSrc: plot2Pic,
      plotUuid: 'embeddingCategoricalMain',
      plotType: 'embeddingCategorical',
    },
  };

  useEffect(() => {
    // Do not update anything if the cell sets are stil loading or if
    // the config does not exist yet.
    if (!config) {
      return;
    }

    const spec = plots[selectedSpec].specGenerator(config);
    generateData(spec);
    setPlotSpec(spec);
  }, [config]);

  // If the user toggles to a different embedding, set the config to be the initial
  // state for that type of plot.
  useEffect(() => {
    setConfig(plots[selectedSpec].initialConfig);
  }, [selectedSpec]);

  // Quick and dirty function to massage prepared data into a good shape.
  // This will be changed once we actually load data from Redux.
  /* eslint-disable no-param-reassign */
  const generateData = (spec) => {
    spec.data.forEach((s) => {
      if (s.name === 'cellSets') {
        s.values = [];

        UMAP.forEach((cell, i) => {
          s.values[cell.cluster_id] = {
            name: `${cell.cluster_id}`,
            cellSetId: cell.cluster_id,
            cellIds: s.values[cell.cluster_id]?.cellIds ? [...s.values[cell.cluster_id].cellIds, i] : [i],
            color: colorProvider.getColor(),
          };
        });
      }

      if (s.name === 'expression') {
        s.values = { expression: UMAP.map((cell) => cell.doubletScore || 0) };
      }

      if (s.name === 'embedding') {
        s.values = UMAP.map((cell) => [cell.UMAP_1, cell.UMAP_2]);
      }
    });
  };

  const updatePlotWithChanges = (obj) => {
    const newConfig = _.cloneDeep(config);
    _.merge(newConfig, obj);
    setConfig(newConfig);
  };

  const renderPlot = () => {
    if (error) {
      return (
        <PlatformError
          description={error}
          onClick={() => { }}
        />
      );
    }

    return (
      <center>
        <Vega spec={plotSpec} renderer='canvas' />
      </center>
    );
  };

  if (!config) {
    return (
      <center>
        <Spin size='large' />
      </center>
    );
  }

  return (
    <>
      <PageHeader
        title={plots[selectedSpec].title}
        style={{ width: '100%', paddingRight: '0px' }}
      />
      <Row>
        <Col span={15}>
          {renderPlot()}
        </Col>

        <Col span={3}>
          <Space direction='vertical'>
            <Tooltip title='The number of dimensions used to configure the embedding is set here. This dictates the number of clusters in the Uniform Manifold Approximation and Projection (UMAP) which is taken forward to the ‘data exploration’ page.'>
              <Button icon={<InfoCircleOutlined />} />
            </Tooltip>

            {Object.entries(plots).map(([key, plot]) => (
              <button
                type='button'
                key={key}
                onClick={() => setSelectedSpec(key)}
                style={{
                  padding: 0, margin: 0, border: 0, backgroundColor: 'transparent',
                }}
              >
                <img
                  alt={plot.title}
                  src={plot.imgSrc}
                  style={{
                    height: '100px',
                    width: '100px',
                    align: 'center',
                    padding: '8px',
                    border: '1px solid #000',
                  }}
                />
              </button>

            ))}
          </Space>
        </Col>

        <Col span={5}>
          <CalculationConfig experimentId={experimentId} />
          <Collapse>
            <Panel header='Plot styling' key='styling'>
              <Collapse accordion>
                <Panel header='Main Schema' key='main-schema'>
                  <DimensionsRangeEditor
                    width={config.dimensions.width}
                    height={config.dimensions.height}
                    onWidthUpdate={(val) => updatePlotWithChanges({ dimensions: { width: val } })}
                    onHeightUpdate={(val) => updatePlotWithChanges({ dimensions: { height: val } })}
                  />
                  <Collapse accordion>
                    <Panel header='Define and Edit Title' key='title'>
                      <TitleDesign
                        title={config.title.text}
                        fontSize={config.title.fontSize}
                        anchor={config.title.anchor}
                        onTitleUpdate={(e) => updatePlotWithChanges({ title: { text: e.target.value } })}
                        onFontSizeUpdate={(val) => updatePlotWithChanges({ title: { fontSize: val } })}
                        onAnchorUpdate={(e) => updatePlotWithChanges({ title: { anchor: e.target.value } })}
                      />
                    </Panel>
                    <Panel header='Font' key='font'>
                      <FontDesign
                        font={config.fontStyle.font}
                        onUpdate={(e) => updatePlotWithChanges({ fontStyle: { font: e.target.value } })}
                      />
                    </Panel>
                  </Collapse>
                </Panel>
                <Panel header='Axes and Margins' key='axes'>
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
                {plots[selectedSpec].initialConfig === initialPlotConfigStates.embeddingContinuous && (
                  <Panel header='Colours' key='colors'>
                    <ColourbarDesign
                      value={config.colour.gradient}
                      onUpdate={(e) => updatePlotWithChanges({ colour: { gradient: e.target.value } })}
                    />
                    <ColourInversion
                      value={config.colour.toggleInvert}
                      onUpdate={(e) => updatePlotWithChanges(invertColour(e.target.value))}
                    />
                  </Panel>
                )}
                {plots[selectedSpec].initialConfig === initialPlotConfigStates.embeddingCategorical && (
                  <Panel header='Colour inversion'>
                    <ColourInversion
                      config={config}
                      onUpdate={updatePlotWithChanges}
                    />
                  </Panel>
                )}
                <Panel header='Markers' key='marker'>
                  <PointDesign
                    shape={config.marker.shape}
                    size={config.marker.size}
                    opacity={config.marker.opacity}
                    onShapeUpdate={(e) => updatePlotWithChanges({ marker: { shape: e.target.value } })}
                    onSizeUpdate={(val) => updatePlotWithChanges({ marker: { size: val } })}
                    onOpacityUpdate={(val) => updatePlotWithChanges({ marker: { opacity: val } })}
                  />
                </Panel>
                <Panel header='Legend' key='legend'>
                  <LegendEditor
                    onEnabledUpdate={(e) => updatePlotWithChanges({ legend: { enabled: e.target.value } })}
                    onValueUpdate={(e) => updatePlotWithChanges({ legend: { position: e.target.value } })}
                    enabled={config.legend.enabled}
                    position={config.legend.position}
                    option={{ positions: 'corners' }}
                  />
                </Panel>
                <Panel header='Labels' key='labels'>
                  <LabelsDesign
                    enabled={config.label.enabled}
                    size={config.label.size}
                    onEnabledUpdate={(e) => updatePlotWithChanges({ label: { enabled: e.target.value } })}
                    onSizeUpdate={(val) => updatePlotWithChanges({ label: { size: val } })}
                  />
                </Panel>
              </Collapse>
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};

export default EmbeddingPreview;
