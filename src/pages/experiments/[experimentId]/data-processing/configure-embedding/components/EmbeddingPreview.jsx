import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Row, Col, Space, Button, Tooltip, PageHeader, Spin, Collapse, Empty,
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
import {
  loadProcessingSettings,
} from '../../../../../../redux/actions/experimentSettings';
import PlatformError from '../../../../../../components/PlatformError';
import { initialPlotConfigStates } from '../../../../../../redux/reducers/componentConfig/initialState';
import { loadCellSets } from '../../../../../../redux/actions/cellSets';
import { loadEmbedding } from '../../../../../../redux/actions/embedding';
import generateEmbeddingCategoricalSpec from '../../../../../../utils/plotSpecs/generateEmbeddingCategoricalSpec';
import generateEmbeddingContinuousSpec from '../../../../../../utils/plotSpecs/generateEmbeddingContinuousSpec';
import DimensionsRangeEditor from '../../../plots-and-tables/components/DimensionsRangeEditor';
import ColourbarDesign from '../../../plots-and-tables/components/ColourbarDesign';
import ColourInversion from '../../../plots-and-tables/components/ColourInversion';
import AxesDesign from '../../../plots-and-tables/components/AxesDesign';
import PointDesign from '../../../plots-and-tables/components/PointDesign';
import TitleDesign from '../../../plots-and-tables/components/TitleDesign';
import FontDesign from '../../../plots-and-tables/components/FontDesign';
import LegendEditor from '../../../plots-and-tables/components/LegendEditor';
import LabelsDesign from '../../../plots-and-tables/components/LabelsDesign';

const { Panel } = Collapse;

const EmbeddingPreview = (props) => {
  const { experimentId } = props;

  const dispatch = useDispatch();

  const [selectedSpec, setSelectedSpec] = useState('cellCluster');
  const [plotSpec, setPlotSpec] = useState({});
  const [config, setConfig] = useState(null);

  const embeddingSettings = useSelector((state) => state.experimentSettings.processing.configureEmbedding);
  const embeddingMethod = embeddingSettings?.embeddingSettings?.method;
  const clusteringMethod = embeddingSettings?.clusteringSettings?.method;
  const embedding = useSelector((state) => state.embeddings);
  const cellSets = useSelector((state) => state.cellSets);

  const FILTER_UUID = 'configureEmbedding';

  const plots = {
    cellCluster: {
      title: 'Default clusters',
      initialConfig: initialPlotConfigStates.embeddingCategorical,
      specGenerator: generateEmbeddingCategoricalSpec,
      imgSrc: plot1Pic,
    },
    sample: {
      title: 'Samples',
      initialConfig: initialPlotConfigStates.embeddingCategorical,
      specGenerator: generateEmbeddingCategoricalSpec,
      imgSrc: plot1Pic,
    },
    mitochondrialFraction: {
      title: 'Mitochondrial fraction reads',
      initialConfig: initialPlotConfigStates.embeddingContinuous,
      specGenerator: generateEmbeddingContinuousSpec,
      imgSrc: plot2Pic,
    },
    doubletScore: {
      title: 'Cell doublet score',
      initialConfig: initialPlotConfigStates.embeddingContinuous,
      specGenerator: generateEmbeddingContinuousSpec,
      imgSrc: plot2Pic,
    },
  };

  // Start loading by fetching the settings and cell sets.
  useEffect(() => {
    dispatch(loadCellSets(experimentId));
    dispatch(loadProcessingSettings(experimentId, FILTER_UUID));
  }, []);

  // Once the config is loaded, we can also load the embedding.
  useEffect(() => {
    if (!embeddingMethod) {
      return;
    }

    dispatch(loadEmbedding(experimentId, embeddingMethod));
  }, [embeddingMethod]);

  useEffect(() => {
    // Do not update anything if the cell sets are stil loading or if
    // the config does not exist yet.
    if (!config) {
      return;
    }

    // If no embedding method is available yet, the config did not load.
    // We can skip processing until it is done.
    if (!embeddingMethod) {
      return;
    }

    // If the config is loaded, but the embedding is still loading, we
    // don't have any data to add.
    if (!embedding[embeddingMethod] || embedding[embeddingMethod].loading) {
      return;
    }

    // If cell sets don't exist yet or they're loading, wait until they are done.
    if (!cellSets || cellSets.loading) {
      return;
    }

    // Otherwise, begin by creating the spec appropriate for the plot.
    const spec = plots[selectedSpec].specGenerator(config);
    generateData(spec);
    setPlotSpec(spec);
  }, [config, embeddingSettings, embedding]);

  useEffect(() => {
    // If the user toggles to a different embedding, set the config to be the initial
    // state for that type of plot.
    setConfig(_.cloneDeep(plots[selectedSpec].initialConfig));
  }, [selectedSpec]);

  // Quick and dirty function to massage prepared data into a good shape.
  // This will be changed once we actually load data from Redux.
  /* eslint-disable no-param-reassign */
  const generateData = (spec) => {
    spec.data.forEach((s) => {
      if (s.name === 'cellSets') {
        s.values = [];

        let rootCellSetName = null;

        switch (selectedSpec) {
          case 'sample': {
            rootCellSetName = 'sample';
            break;
          }
          case 'cellCluster': {
            rootCellSetName = clusteringMethod;
            break;
          }
          default: {
            throw new Error('Invalid categorical plot type, unsure what cell set to display.');
          }
        }

        const clusters = cellSets.hierarchy
          .find((o) => o.key === rootCellSetName)?.children
          .map((child) => child.key) || [];

        clusters.forEach((cluster) => {
          const { name, cellIds, color } = cellSets.properties[cluster];
          s.values.push({
            name,
            cellSetId: cluster,
            cellIds: Array.from(cellIds),
            color,
          });
        });
      }

      if (s.name === 'expression') {
        s.values = { expression: UMAP.map((cell) => cell.doubletScore || 0) };
      }

      if (s.name === 'embedding') {
        s.values = embedding[embeddingMethod].data;
      }
    });
  };

  /* eslint-enable no-param-reassign */
  const updatePlotWithChanges = (obj) => {
    const newConfig = _.cloneDeep(config);
    _.merge(newConfig, obj);
    setConfig(newConfig);
  };

  const renderPlot = () => {
    if (embeddingMethod && embedding[embeddingMethod]?.error) {
      return (
        <PlatformError
          description={embedding[embeddingMethod]?.error}
          onClick={() => dispatch(loadEmbedding(experimentId, embeddingMethod))}
        />
      );
    }

    if (cellSets && cellSets.error) {
      return (
        <PlatformError
          description={cellSets.error}
          onClick={() => dispatch(loadCellSets(experimentId))}
        />
      );
    }

    if (embeddingMethod && embedding[embeddingMethod]?.loading) {
      return (
        <center>
          <Spin size='large' />
        </center>
      );
    }

    if (selectedSpec === 'sample'
      && plotSpec.data.find((d) => d.name === 'cellSets').values.length === 0) {
      return (
        <Empty description='Your project has only one sample.' />

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
                {plots[selectedSpec].initialConfig === initialPlotConfigStates.embeddingContinuous && (
                  <Panel header='Colours' key='colors'>
                    <ColourbarDesign
                      config={config}
                      onUpdate={updatePlotWithChanges}
                    />
                    <ColourInversion
                      config={config}
                      onUpdate={updatePlotWithChanges}
                    />
                  </Panel>
                )}

                {plots[selectedSpec].initialConfig === initialPlotConfigStates.embeddingCategorical
                  && (
                    <Panel header='Colour inversion'>
                      <ColourInversion
                        config={config}
                        onUpdate={updatePlotWithChanges}
                      />
                    </Panel>
                  )}

                <Panel header='Markers' key='marker'>
                  <PointDesign config={config} onUpdate={updatePlotWithChanges} />
                </Panel>
                <Panel header='Legend' key='legend'>
                  <LegendEditor
                    onUpdate={updatePlotWithChanges}
                    legendEnabled={config.legendEnabled}
                    legendPosition={config.legendPosition}
                    legendOptions='corners'
                  />
                </Panel>
                <Panel header='Labels' key='labels'>
                  <LabelsDesign config={config} onUpdate={updatePlotWithChanges} />
                </Panel>
              </Collapse>
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};

EmbeddingPreview.defaultProps = {
};

EmbeddingPreview.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default EmbeddingPreview;
