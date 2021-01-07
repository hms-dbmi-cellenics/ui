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
import ColourInversion from '../components/ColourInversion';
import LogExpression from './components/LogExpression';
import AxesDesign from '../components/AxesDesign';
import PointDesign from '../components/PointDesign';
import TitleDesign from '../components/TitleDesign';
import FontDesign from '../components/FontDesign';
import LegendEditor from '../components/LegendEditor';
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

  const router = useRouter();
  const { experimentId } = router.query;

  useEffect(() => {
    if (isBrowser) {
      if (!data) {
        dispatch(loadEmbedding(experimentId, embeddingType));
      }
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
      if (!selectedExpression) {
        dispatch(loadGeneExpression(experimentId, [selectedGene.current]));
      }
    }
  }, [experimentId]);

  // obj is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const generateVegaData = () => ({
    expression: selectedExpression,
    embedding: _.cloneDeep(data),
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
          onClick={() => dispatch(loadEmbedding(experimentId, embeddingType))}
        />
      );
    }

    if (
      !config
      || !data
      || loading
      || !isBrowser
      || expressionLoading.includes(selectedGene.current)
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
          </Collapse>
          <Collapse accordion>
            <Panel header='Log Transformation' key='5'>
              <LogExpression config={config} onUpdate={updatePlotWithChanges} />
            </Panel>
          </Collapse>
          <Collapse accordion>
            <Panel header='Main Schema' key='2'>
              <DimensionsRangeEditor
                config={config}
                onUpdate={updatePlotWithChanges}
              />
              <Collapse accordion>
                <Panel header='Define and Edit Title' key='6'>
                  <TitleDesign
                    config={config}
                    onUpdate={updatePlotWithChanges}
                  />
                </Panel>
                <Panel header='Font' key='9'>
                  <FontDesign
                    config={config}
                    onUpdate={updatePlotWithChanges}
                  />
                </Panel>
              </Collapse>
            </Panel>
            <Panel header='Axes and Margins' key='3'>
              <AxesDesign config={config} onUpdate={updatePlotWithChanges} />
            </Panel>
            <Panel header='Colours' key='10'>
              <ColourbarDesign
                config={config}
                onUpdate={updatePlotWithChanges}
              />
              <Collapse accordion>
                <Panel header='Colour Inversion' key='4'>
                  <ColourInversion
                    config={config}
                    onUpdate={updatePlotWithChanges}
                  />
                </Panel>
              </Collapse>
            </Panel>
            <Panel header='Markers' key='11'>
              <PointDesign config={config} onUpdate={updatePlotWithChanges} />
            </Panel>
            <Panel header='Legend' key='12'>
              <LegendEditor
                onUpdate={updatePlotWithChanges}
                legendEnabled={config.legendEnabled}
                legendPosition={config.legendPosition}
                legendOptions='corners'
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default EmbeddingContinuousPlot;
