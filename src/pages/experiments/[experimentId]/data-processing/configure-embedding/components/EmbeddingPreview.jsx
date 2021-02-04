/* eslint-disable no-param-reassign */
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import {
  Row, Col, Space, Button, Tooltip, PageHeader, Spin, Collapse,
} from 'antd';

import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import { Vega } from 'react-vega';
import plot1Pic from '../../../../../../../static/media/plot9.png';
import plot2Pic from '../../../../../../../static/media/plot10.png';
import CalculationConfig from './CalculationConfig';
import { loadEmbedding } from '../../../../../../redux/actions/embedding';
import { loadGeneExpression } from '../../../../../../redux/actions/genes';
import { loadCellSets } from '../../../../../../redux/actions/cellSets';

import PlatformError from '../../../../../../components/PlatformError';
import { initialPlotConfigStates } from '../../../../../../redux/reducers/componentConfig/initialState';

import {
  updatePlotConfig,
  loadPlotConfig,
} from '../../../../../../redux/actions/componentConfig';

import generateEmbeddingCategoricalSpec from '../../../../../../utils/plotSpecs/generateEmbeddingCategoricalSpec';
import generateEmbeddingContinuousSpec from '../../../../../../utils/plotSpecs/generateEmbeddingContinuousSpec';
import isBrowser from '../../../../../../utils/environment';
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

const EmbeddingPreview = () => {
  const router = useRouter();
  const { experimentId } = router.query;
  const [selectedSpec, setSelectedSpec] = useState('sample');
  const [plotSpec, setPlotSpec] = useState({});

  const dispatch = useDispatch();

  const error = false;

  const plots = {
    sample: {
      title: 'Colored by Samples',
      specGenerator: generateEmbeddingCategoricalSpec,
      imgSrc: plot1Pic,
      plotUuid: 'embeddingPreviewBySample',
      plotType: 'embeddingCategorical',
    },
    cellCluster: {
      title: 'Colored by CellSets',
      specGenerator: generateEmbeddingCategoricalSpec,
      imgSrc: plot1Pic,
      plotUuid: 'embeddingPreviewByCellSets',
      plotType: 'embeddingCategorical',
    },
    mitochondrialFraction: {
      title: 'Mitochondrial fraction reads',
      specGenerator: generateEmbeddingContinuousSpec,
      imgSrc: plot2Pic,
      plotUuid: 'embeddingPreviewMitochondrialReads',
      plotType: 'embeddingContinuous',
    },
    doubletScore: {
      title: 'Cell doublet score',
      specGenerator: generateEmbeddingContinuousSpec,
      imgSrc: plot2Pic,
      plotUuid: 'embeddingPreviewDoubletScore',
      plotType: 'embeddingContinuous',
    },
  };

  const config = useSelector((state) => state.componentConfig[plots[selectedSpec].plotUuid]?.config);

  // Prepare data for categorical embedding
  const embeddingType = useSelector((state) => state.experimentSettings.configureEmbedding?.embeddingSettings.method);

  const cellSets = useSelector((state) => state.cellSets);
  const { data } = useSelector((state) => state.embeddings[embeddingType]) || {};
  const selectedExpression = useSelector((state) => state.genes.expression.data[config?.shownGene]);

  useEffect(() => {
    if (!data) {
      dispatch(loadEmbedding(experimentId, embeddingType));
      dispatch(loadCellSets(experimentId));
    }
  }, [experimentId]);

  useEffect(() => {
    // Do not update anything if the cell sets are stil loading or if
    // the config does not exist yet.
    if (!config || !data) {
      return;
    }

    if (!selectedExpression && config.shownGene) {
      dispatch(loadGeneExpression(experimentId, [config.shownGene]));
    }

    if ((plots[selectedSpec].plotType === 'embeddingContinuous' && !selectedExpression)
      || !cellSets) {
      return;
    }

    const spec = plots[selectedSpec].specGenerator(config);

    if (plots[selectedSpec].plotType === 'embeddingContinuous') {
      // If embedding is continuous

      spec.data.forEach((s) => {
        if (s.name === 'expression') {
          s.values = selectedExpression;
        } else if (s.name === 'embedding') {
          s.values = data;
        }
      });
    } else {
      // If embedding categorical
      // First, find the child nodes in the hirerarchy.
      let newCellSets = cellSets.hierarchy.find(
        (rootNode) => rootNode.key === config.selectedCellSet,
      )?.children || [];

      // Build up the data source based on the properties. Note that the child nodes
      // in the hierarchy are /objects/ with a `key` property, hence the destructuring
      // in the function.
      newCellSets = newCellSets.map(({ key }) => ({
        cellSetId: key,
        ...cellSets.properties[key],
        cellIds: Array.from(cellSets.properties[key].cellIds),
      }));

      spec.data.forEach((s) => {
        if (s.name === 'cellSets') {
          s.values = newCellSets;
        } else if (s.name === 'embedding') {
          s.values = data;
        }
      });
    }

    setPlotSpec(spec);
  }, [config, data, selectedExpression, cellSets]);

  // If the user toggles to a different embedding, set the config to be the initial
  // state for that type of plot.
  useEffect(() => {
    if (!isBrowser) return;
    const { plotUuid, plotType } = plots[selectedSpec];

    if (!config) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }
  }, [selectedSpec]);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plots[selectedSpec].plotUuid, obj));
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
                  <DimensionsRangeEditor config={config} onUpdate={updatePlotWithChanges} />
                  <Collapse accordion>
                    <Panel header='Define and Edit Title' key='title'>
                      <TitleDesign config={config} onUpdate={updatePlotWithChanges} />
                    </Panel>
                    <Panel header='Font' key='font'>
                      <FontDesign config={config} onUpdate={updatePlotWithChanges} />
                    </Panel>
                  </Collapse>
                </Panel>
                <Panel header='Axes and Margins' key='axes'>
                  <AxesDesign config={config} onUpdate={updatePlotWithChanges} />
                </Panel>
                {plots[selectedSpec].initialConfig === initialPlotConfigStates.embeddingContinuous && (
                  <Panel header='Colours' key='colors'>
                    <ColourbarDesign config={config} onUpdate={updatePlotWithChanges} />
                    <ColourInversion config={config} onUpdate={updatePlotWithChanges} />
                  </Panel>
                )}
                {plots[selectedSpec].initialConfig === initialPlotConfigStates.embeddingCategorical && (
                  <Panel header='Colour inversion'>
                    <ColourInversion config={config} onUpdate={updatePlotWithChanges} />
                  </Panel>
                )}
                <Panel header='Markers' key='marker'>
                  <PointDesign config={config} onUpdate={updatePlotWithChanges} />
                </Panel>
                {plots[selectedSpec].initialConfig === initialPlotConfigStates.embeddingContinuous && (
                  <Panel header='Legend' key='legend'>
                    <LegendEditor config={config} onUpdate={updatePlotWithChanges} />
                  </Panel>
                )}
                {plots[selectedSpec].initialConfig === initialPlotConfigStates.embeddingCategorical && (
                  <Panel header='Legend' key='legend'>
                    <LegendEditor config={config} onUpdate={updatePlotWithChanges} option={{ position: 'top-bottom' }} />
                  </Panel>
                )}

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

export default EmbeddingPreview;
