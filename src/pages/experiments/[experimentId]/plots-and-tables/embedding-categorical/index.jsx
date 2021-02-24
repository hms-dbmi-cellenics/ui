/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Space,
  Collapse,
  Skeleton,
  Select,
  Spin,
  Tooltip,
  Button,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';
import PlotStyling from '../../../../../components/plots/styling/PlotStyling';
import {
  updatePlotConfig,
  loadPlotConfig,
} from '../../../../../redux/actions/componentConfig';
import { generateSpec } from '../../../../../utils/plotSpecs/generateEmbeddingCategoricalSpec';
import Header from '../../../../../components/plots/Header';
import PlatformError from '../../../../../components/PlatformError';

import { loadEmbedding } from '../../../../../redux/actions/embedding';
import { loadProcessingSettings } from '../../../../../redux/actions/experimentSettings';
import { loadCellSets } from '../../../../../redux/actions/cellSets';

const { Panel } = Collapse;

// TODO: when we want to enable users to create their custom plots,
// we will need to change this to proper Uuid
const plotUuid = 'embeddingCategoricalMain';
const plotType = 'embeddingCategorical';
const embeddingType = 'umap';

const route = {
  path: 'embedding-categorical',
  breadcrumbName: 'Categorical Embedding',
};

const EmbeddingCategoricalPlot = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const cellSets = useSelector((state) => state.cellSets);
  const { data, loading, error } = useSelector((state) => state.embeddings[embeddingType]) || {};
  const processingSettings = useSelector((state) => state.experimentSettings.processing);

  const [plotSpec, setPlotSpec] = useState({});

  // First, load experiment ID data from the router.
  useEffect(() => {
    if (!processingSettings.configureEmbedding) {
      dispatch(loadProcessingSettings(experimentId, embeddingType));
    }

    // Simultaneously, try to load the plot configuration.
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));

    // Also, try loading the cell sets in the experiment.
    dispatch(loadCellSets(experimentId));
  }, [experimentId]);

  useEffect(() => {
    if (!data && processingSettings.configureEmbedding && experimentId) {
      dispatch(loadEmbedding(experimentId, embeddingType));
    }
  }, [processingSettings, experimentId]);

  useEffect(() => {
    // Do not update anything if the cell sets are stil loading or if
    // the config does not exist yet.
    if (!config || cellSets.loading) {
      return;
    }

    // due to a bug in vega with React with using data with source coming from other data,
    // we have to inject the data in the Vega spec.
    const spec = generateSpec(config);
    generateData(spec);

    // Set the spec.
    setPlotSpec(spec);
  }, [config, cellSets]);

  const generateCellSetOptions = () => {
    if (loading) {
      return [];
    }

    const hierarchy = cellSets.hierarchy.map((cellSet) => ({
      key: cellSet.key,
      children: cellSet.children?.length || 0,
    }));
    return hierarchy.map(({ key, children }) => ({
      value: key,
      label: `${cellSets.properties[key].name} (${children} ${children === 1 ? 'child' : 'children'})`,
    }));
  };

  const generateData = (spec) => {
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

    spec.data.forEach((datum) => {
      if (datum.name === 'cellSets') {
        datum.values = newCellSets;
      } else if (datum.name === 'embedding') {
        datum.values = data;
      }
    });
  };

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const onCellSetSelect = ({ value }) => {
    updatePlotWithChanges({ selectedCellSet: value });
  };

  const plotStylingConfig = [
    {
      panelTitle: 'Main schema',
      controls: ['dimensions'],
      children: [
        {
          panelTitle: 'Title',
          controls: ['title'],
        },
        {
          panelTitle: 'Font',
          controls: ['font'],
        },
      ],
    },
    {
      panelTitle: 'Axes and Margins',
      controls: ['axes'],
    },
    {
      panelTitle: 'Colour Inversion',
      controls: ['colourInversion'],
    },
    {
      panelTitle: 'Markers',
      controls: ['markers'],
    },
    {
      panelTitle: 'Legend',
      controls: [{
        name: 'legend',
        props: {
          option: {
            positions: 'top-bottom',
          },
        },
      }],
    },
  ];

  if (!config) {
    return <Skeleton />;
  }

  const renderPlot = () => {
    if (error) {
      return (
        <PlatformError
          description={error}
          onClick={() => dispatch(loadEmbedding(experimentId, embeddingType))}
        />
      );
    }

    if (!config || !data || loading) {
      return (
        <center>
          <Spin size='large' />
        </center>
      );
    }

    return (
      <center>
        <Vega spec={plotSpec} renderer='canvas' />
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
              <Panel
                header='Preview'
                key='1'
                extra={(
                  <Tooltip title='In order to rename existing clusters or create new ones, use the cell set tool, located in the Data Exploration page.'>
                    <Button icon={<InfoCircleOutlined />} />
                  </Tooltip>
                )}
              >
                {renderPlot()}
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse accordion defaultActiveKey={['1']}>
              <Panel header='Group by' key='1'>
                <p>
                  Select the cell set category you would like to group cells by.
                </p>
                <Select
                  labelInValue
                  style={{ width: '100%' }}
                  placeholder='Select cell set...'
                  value={{ key: config.selectedCellSet }}
                  options={generateCellSetOptions()}
                  onChange={onCellSetSelect}
                />
              </Panel>
            </Collapse>
            <PlotStyling formConfig={plotStylingConfig} config={config} onUpdate={updatePlotWithChanges} />
          </Space>
        </Col>
      </Row>
    </div>
  );
};

EmbeddingCategoricalPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default EmbeddingCategoricalPlot;
