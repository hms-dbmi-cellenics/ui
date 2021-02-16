import React, {
  useState, useEffect, useCallback,
} from 'react';
import _ from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import {
  Collapse, InputNumber, Form, Select, Typography, Tooltip, Slider, Button, Alert,
} from 'antd';
import PropTypes from 'prop-types';
import { QuestionCircleOutlined } from '@ant-design/icons';
import PreloadContent from '../../PreloadContent';

import {
  updateProcessingSettings,
  saveProcessingSettings,
} from '../../../redux/actions/experimentSettings';
import { loadEmbedding } from '../../../redux/actions/embedding';

const { Option } = Select;
const { Panel } = Collapse;
const { Text } = Typography;

const MIN_DIST_TEXT = 'This controls how tightly the embedding is allowed to compress points together. '
  + 'Larger values ensure embedded points are more evenly distributed, while '
  + 'smaller values allow the algorithm to optimise more accurately with regard '
  + 'to local structure. Expected range: 0.001 to 0.5. Default is 0.1.';

const CalculationConfig = (props) => {
  const { experimentId } = props;
  const FILTER_UUID = 'configureEmbedding';

  const dispatch = useDispatch();

  const [changesOutstanding, setChangesOutstanding] = useState(false);

  const data = useSelector((state) => state.experimentSettings.processing[FILTER_UUID]);
  const { method: clusteringMethod } = data?.clusteringSettings || {};
  const { method: embeddingMethod } = data?.embeddingSettings || {};
  const { umap: umapSettings, tsne: tsneSettings } = data?.embeddingSettings.methodSettings || {};
  const { louvain: louvainSettings } = data?.clusteringSettings.methodSettings || {};

  const [resolution, setResolution] = useState(null);
  const [minDistance, setMinDistance] = useState(null);

  const initialValues = {
    embeddingSettings: {
      method: embeddingMethod,
      methodSettings: {
        umap: {
          minimumDistance: umapSettings.minimumDistance,
          distanceMetric: umapSettings.distanceMetric,
        },
        tsne: {
          perplexity: tsneSettings.perplexity,
          learningRate: tsneSettings.learningRate,
        },

      },
    },
  };
  const [changes, setChanges] = useState(initialValues);

  useEffect(() => {
    if (!resolution && louvainSettings) {
      setResolution(louvainSettings.resolution);
    }
  }, [louvainSettings]);

  useEffect(() => {
    if (!minDistance && umapSettings) {
      setMinDistance(umapSettings.minimumDistance);
    }
  }, [umapSettings]);

  const dispatchDebounce = useCallback(_.debounce((f) => {
    dispatch(f);
  }, 1500), []);

  const updateSettings = (diff) => {
    if (diff.embeddingSettings) {
      // If this is an embedding change, indicate to user that their changes are not
      // applied until they hit Apply.

      setChangesOutstanding(true);
      dispatch(updateProcessingSettings(
        experimentId,
        FILTER_UUID,
        diff,
      ));
    } else {
      // If it's a clustering change, debounce the save process at 1.5s.
      dispatchDebounce(saveProcessingSettings(experimentId, FILTER_UUID));

      dispatch(updateProcessingSettings(
        experimentId,
        FILTER_UUID,
        diff,
      ));
    }
  };

  // When the Apply button is pressed, remove the warning and save to DynamoDB.
  const applyEmbeddingSettings = () => {
    updateSettings(changes);
    setChangesOutstanding(false);
    dispatch(saveProcessingSettings(experimentId, FILTER_UUID));
    dispatch(loadEmbedding(experimentId, embeddingMethod));
  };
  const newChanges = changes;

  const setMinimumDistance = (value) => {
    newChanges.embeddingSettings.methodSettings.umap.minimumDistance = parseFloat(value);
    setChanges({ ...newChanges });
  };
  const setDistanceMetric = (value) => {
    newChanges.embeddingSettings.methodSettings.umap.distanceMetric = parseFloat(value);
    setChanges({ ...newChanges });
  };
  if (!changesOutstanding && !_.isEqual(changes, initialValues)) {
    setChangesOutstanding(true);
  }
  if (changesOutstanding && _.isEqual(changes, initialValues)) {
    setChangesOutstanding(false);
  }
  const renderUMAPSettings = () => {
    const { umap } = changes.embeddingSettings.methodSettings;
    return (
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
            value={umap.minimumDistance}
            min={0}
            step={0.1}
            onChange={(value) => setMinimumDistance(value)}
            onStep={(value) => setMinimumDistance(value)}
            onPressEnter={(e) => e.preventDefault()}

            onBlur={(e) => setMinimumDistance(e.target.value)}
          />
        </Form.Item>
        <Form.Item label='Distance metric:'>
          <Tooltip title='Cosine metric is going to be supported on a future version of the platform.'>
            <Select
              value={umap.distanceMetric}
              onChange={(value) => setDistanceMetric(value)}
            >
              <Option value='euclidean'>Euclidean</Option>
              <Option value='cosine' disabled>Cosine</Option>
            </Select>
          </Tooltip>
        </Form.Item>
      </>
    );
  };
  const setLearningRate = (value) => {
    newChanges.embeddingSettings.methodSettings.tsne.learningRate = parseFloat(value);
    setChanges({ ...newChanges });
  };
  const setPerplexity = (value) => {
    newChanges.embeddingSettings.methodSettings.tsne.perplexity = parseFloat(value);
    setChanges({ ...newChanges });
  };
  const renderTSNESettings = () => {
    const { tsne } = changes.embeddingSettings.methodSettings;
    return (
      <>
        <Form.Item>
          <Text strong>Settings for t-SNE:</Text>
        </Form.Item>
        <Form.Item label='Perplexity:'>
          <InputNumber
            value={tsne.perplexity}
            min={5}
            onChange={(value) => setPerplexity(value)}
            onStep={(value) => setPerplexity(value)}
            onPressEnter={(e) => e.preventDefault()}
            onBlur={(e) => setPerplexity(e.target.value)}
          />
        </Form.Item>
        <Form.Item label='Learning rate:'>
          <InputNumber
            value={tsne.learningRate}
            min={10}
            max={1000}
            step={10}
            onChange={(value) => setLearningRate(value)}
            onStep={(value) => setLearningRate(value)}
            onPressEnter={(e) => e.preventDefault()}
            onBlur={(e) => setLearningRate(e.target.value)}
          />
        </Form.Item>
      </>
    );
  };

  if (!data) {
    return <PreloadContent />;
  }

  return (
    <Collapse defaultActiveKey={['embedding-settings', 'clustering-settings']}>
      <Panel header='Embedding settings' key='embedding-settings'>
        <Form size='small'>
          {changesOutstanding && (
            <Form.Item>
              <Alert message='Your changes are not yet applied. To update the plots, click Apply.' type='warning' showIcon />
            </Form.Item>
          )}
          <Form.Item label='Method:'>
            <Select
              value={changes.embeddingSettings.method}
              // changes.({ embeddingSettings: { method: value } })
              onChange={(value) => {
                newChanges.embeddingSettings.method = value;
                setChanges({ ...newChanges });
              }}
            >
              <Option value='umap'>UMAP</Option>
              <Option value='tsne'>t-SNE</Option>
            </Select>
          </Form.Item>
          {changes.embeddingSettings.method === 'umap' && renderUMAPSettings()}
          {changes.embeddingSettings.method === 'tsne' && renderTSNESettings()}

          <Form.Item>
            <Tooltip title={!changesOutstanding ? 'No outstanding changes' : ''}>
              <Button type='primary' htmlType='submit' disabled={!changesOutstanding} onClick={applyEmbeddingSettings}>Apply</Button>
            </Tooltip>
          </Form.Item>
        </Form>
      </Panel>
      <Panel header='Clustering settings' key='clustering-settings'>
        <Form size='small'>
          <Form.Item label='Clustering method:'>
            <Tooltip title='Cosine metric is going to be supported on a future version of the platform.'>
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
            </Tooltip>
          </Form.Item>
          <Form.Item label='Resolution'>
            <Slider
              value={resolution}
              min={0}
              max={2}
              step={0.1}
              onChange={(value) => {
                setResolution(value);
              }}
              onAfterChange={(value) => {
                updateSettings({
                  clusteringSettings: {
                    methodSettings: {
                      louvain: { resolution: value },
                    },
                  },
                });
              }}
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
