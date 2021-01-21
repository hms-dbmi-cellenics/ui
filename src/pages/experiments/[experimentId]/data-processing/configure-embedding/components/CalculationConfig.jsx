import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Collapse, InputNumber, Form, Select, Typography, Tooltip, Slider,
} from 'antd';
import PropTypes from 'prop-types';
import { QuestionCircleOutlined } from '@ant-design/icons';

import { updateProcessingSettings } from '../../../../../../redux/actions/experimentSettings';

const { Option } = Select;
const { Panel } = Collapse;
const { Text } = Typography;

const MIN_DIST_TEXT = 'This controls how tightly the embedding is allowed compress points together. '
  + 'Larger values ensure embedded points are more evenly distributed, while '
  + 'smaller values allow the algorithm to optimise more accurately with regard '
  + 'to local structure. Expected range: 0.001 to 0.5. Default is 0.1.';

const CalculationConfig = (props) => {
  const { experimentId } = props;
  const FILTER_UUID = 'configureEmbedding';
  const dispatch = useDispatch();

  const data = useSelector((state) => state.experimentSettings.processing[FILTER_UUID]);

  const { method: clusteringMethod } = data.clusteringSettings;
  const { method: embeddingMethod } = data.embeddingSettings;
  const { umap: umapSettings, tsne: tsneSettings } = data.embeddingSettings.methodSettings;
  const { louvain: louvainSettings } = data.clusteringSettings.methodSettings;

  const updateSettings = (diff) => dispatch(updateProcessingSettings(
    experimentId,
    FILTER_UUID,
    diff,
  ));

  const UMAPSettings = (
    <>
      <Form.Item>
        <Text strong>Settings for UMAP:</Text>
      </Form.Item>
      <Form.Item label={(
        <span>
          Minimum distance&nbsp;
          <Tooltip title={MIN_DIST_TEXT}>
            <QuestionCircleOutlined />
          </Tooltip>
        </span>
      )}
      >
        <InputNumber
          value={umapSettings.minimumDistance}
          step={0.1}
          onChange={(value) => updateSettings(
            { embeddingSettings: { methodSettings: { umap: { minimumDistance: value } } } },
          )}
        />
      </Form.Item>
      <Form.Item label='Distance metric:'>
        <Select
          value={umapSettings.distanceMetric}
          onChange={(value) => updateSettings(
            { embeddingSettings: { methodSettings: { umap: { distanceMetric: value } } } },
          )}
        >
          <Option value='euclidean'>Euclidean</Option>
          <Option value='cosine' disabled>Cosine</Option>
        </Select>
      </Form.Item>
    </>
  );

  const TSNESettings = (
    <>
      <Form.Item>
        <Text strong>Settings for t-SNE:</Text>
      </Form.Item>
      <Form.Item label='Perplexity:'>
        <InputNumber
          value={tsneSettings.perplexity}
          min={5}
          onChange={(value) => updateSettings(
            { embeddingSettings: { methodSettings: { tsne: { perplexity: value } } } },
          )}
        />
      </Form.Item>
      <Form.Item label='Learning rate:'>
        <InputNumber
          value={tsneSettings.learningRate}
          min={10}
          max={1000}
          step={10}
          onChange={(value) => updateSettings(
            { embeddingSettings: { methodSettings: { tsne: { learningRate: value } } } },
          )}
        />
      </Form.Item>
    </>
  );

  return (
    <Collapse defaultActiveKey={['embedding-settings', 'clustering-settings']}>
      <Panel header='Embedding settings' key='embedding-settings'>
        <Form size='small'>
          <Form.Item label='Method:'>
            <Select
              value={embeddingMethod}
              onChange={(value) => updateSettings(
                { embeddingSettings: { method: value } },
              )}
            >
              <Option value='umap'>UMAP</Option>
              <Option value='tsne'>t-SNE</Option>
            </Select>
          </Form.Item>
          {embeddingMethod === 'umap' && UMAPSettings}
          {embeddingMethod === 'tsne' && TSNESettings}
        </Form>
      </Panel>
      <Panel header='Clustering settings' key='clustering-settings'>
        <Form size='small'>
          <Form.Item label='Clustering method:'>
            <Select
              value={clusteringMethod}
              onChange={(value) => updateSettings(
                { clusteringSettings: { method: value } },
              )}
            >
              <Option value='louvain'>Louvain</Option>
              <Option value='leiden' disabled>Leiden</Option>
              <Option value='slm' disabled>SLM</Option>
            </Select>
          </Form.Item>
          <Form.Item label='Resolution'>
            <Slider
              value={louvainSettings.resolution}
              min={0}
              max={2}
              step={0.1}
              onChange={(value) => updateSettings(
                { clusteringSettings: { methodSettings: { louvain: { resolution: value } } } },
              )}
            />
          </Form.Item>
        </Form>
      </Panel>
    </Collapse>
  );
};

CalculationConfig.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default CalculationConfig;
