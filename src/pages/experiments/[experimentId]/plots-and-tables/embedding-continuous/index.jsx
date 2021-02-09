/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
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
import SelectData from './components/SelectData';
import {
  updatePlotConfig,
  loadPlotConfig,
} from '../../../../../redux/actions/componentConfig/index';
import { loadGeneExpression, loadPaginatedGeneProperties } from '../../../../../redux/actions/genes';
import { loadEmbedding } from '../../../../../redux/actions/embedding';
import { generateSpec } from '../../../../../utils/plotSpecs/generateEmbeddingContinuousSpec';
import Header from '../components/Header';
import isBrowser from '../../../../../utils/environment';
import PlatformError from '../../../../../components/PlatformError';
import loadCellSets from '../../../../../redux/actions/cellSets/loadCellSets';
import { loadProcessingSettings } from '../../../../../redux/actions/experimentSettings';

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

const EmbeddingContinuousPlot = () => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const expressionLoading = useSelector(
    (state) => state.genes.expression.loading,
  );
  const selectedExpression = useSelector(
    (state) => state.genes.expression.data[config?.shownGene],
  );
  const expressionError = useSelector((state) => state.genes.expression.error);
  const { data, loading, error } = useSelector((state) => state.embeddings[embeddingType]) || {};
  const cellSets = useSelector((state) => state.cellSets);
  const processingSettings = useSelector((state) => state.experimentSettings.processing);
  const { properties } = cellSets;
  const router = useRouter();
  const { experimentId } = router.query;
  const PROPERTIES = ['dispersions'];
  const highestDispersionGene = useSelector((state) => state.genes.properties.views[plotUuid]?.data[0]);
  // temporary solution for selecting the default gene until they are displayed with a table
  const tableState = {
    pagination: {
      current: 1, pageSize: 1, showSizeChanger: true, total: 0,
    },
    geneNamesFilter: null,
    sorter: { field: 'dispersions', columnKey: 'dispersions', order: 'descend' },
  };
  if (config?.shownGene === 'notSelected' && experimentId && isBrowser) {
    dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, plotUuid, tableState));
  }

  // updateField is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (updateField) => {
    dispatch(updatePlotConfig(plotUuid, updateField));
  };
  useEffect(() => {
    if (!experimentId || !isBrowser) {
      return;
    }
    if (!processingSettings.configureEmbedding) {
      dispatch(loadProcessingSettings(experimentId, embeddingType));
    }
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));

    dispatch(loadCellSets(experimentId));
  }, [experimentId]);
  if (config && config.shownGene === 'notSelected' && highestDispersionGene) {
    dispatch(loadGeneExpression(experimentId, [highestDispersionGene]));
    updatePlotWithChanges({ shownGene: highestDispersionGene });
  }

  useEffect(() => {
    if (!data && processingSettings.configureEmbedding) {
      dispatch(loadEmbedding(experimentId, embeddingType));
    }
  }, [processingSettings]);

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
    config.shownGene = geneName;
    dispatch(loadGeneExpression(experimentId, [geneName]));
  };

  const renderPlot = () => {
    // The embedding couldn't load. Display an error condition.
    if (expressionError) {
      return (
        <PlatformError
          description={expressionError}
          onClick={() => dispatch(loadGeneExpression(experimentId, [config.shownGene]))}
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
    if (!highestDispersionGene) {
      dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, plotUuid, tableState));
    }
    if (
      !config
      || !data
      || loading
      || !isBrowser
      || expressionLoading.includes(config.shownGene)
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
          spec={generateSpec(config, config.shownGene)}
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
                defaultValue={config.shownGene}
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
              <ColourInversion
                config={config}
                onUpdate={updatePlotWithChanges}
              />
            </Panel>
            <Panel header='Markers' key='11'>
              <PointDesign config={config} onUpdate={updatePlotWithChanges} />
            </Panel>
            <Panel header='Legend' key='12'>
              <LegendEditor
                onUpdate={updatePlotWithChanges}
                config={config}
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default EmbeddingContinuousPlot;
