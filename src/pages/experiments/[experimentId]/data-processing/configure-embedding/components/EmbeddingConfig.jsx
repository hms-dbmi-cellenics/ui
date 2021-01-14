import React, { useState } from 'react';
import {
  Collapse, InputNumber, Form, Select, Typography, Tooltip,
} from 'antd';

import { QuestionCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Panel } = Collapse;
const { Text } = Typography;

const MIN_DIST_TEXT = 'This controls how tightly the embedding is allowed compress points together. '
  + 'Larger values ensure embedded points are more evenly distributed, while '
  + 'smaller values allow the algorithm to optimise more accurately with regard '
  + 'to local structure. Expected range: 0.001 to 0.5. Default is 0.1.';

const EmbeddingConfig = () => {
  const [embeddingMethod, setEmbeddingMethod] = useState('umap');

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
        <InputNumber defaultValue={0.01} step={0.1} />
      </Form.Item>
      <Form.Item label='Distance metric:'>
        <Select defaultValue='euclidean'>
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
        <InputNumber defaultValue={30} min={5} />
      </Form.Item>
      <Form.Item label='Learning rate:'>
        <InputNumber defaultValue={200} min={10} max={1000} />
      </Form.Item>
    </>
  );

  return (
    <Collapse defaultActiveKey={['embedding-settings']}>
      <Panel header='Embedding settings' key='embedding-settings'>
        <Form size='small'>
          <Form.Item label='Method:'>
            <Select value={embeddingMethod} onChange={(value) => setEmbeddingMethod(value)}>
              <Option value='umap'>UMAP</Option>
              <Option value='tsne'>t-SNE</Option>
            </Select>
          </Form.Item>
          {embeddingMethod === 'umap' && UMAPSettings}
          {embeddingMethod === 'tsne' && TSNESettings}
        </Form>
      </Panel>
    </Collapse>
  );
};

export default EmbeddingConfig;
