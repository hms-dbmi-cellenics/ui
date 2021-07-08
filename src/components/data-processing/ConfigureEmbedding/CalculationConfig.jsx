import React, {
  useState, useEffect, useCallback,
} from 'react';
import _ from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import {
  Collapse, InputNumber, Form, Select, Typography, Tooltip, Button, Alert,
} from 'antd';
import PropTypes from 'prop-types';
import { QuestionCircleOutlined } from '@ant-design/icons';
import PreloadContent from '../../PreloadContent';

import { updateFilterSettings, saveProcessingSettings } from '../../../redux/actions/experimentSettings';

import runCellSetsClustering from '../../../redux/actions/cellSets/runCellSetsClustering';

import SliderWithInput from '../../SliderWithInput';

const { Option } = Select;
const { Panel } = Collapse;
const { Text } = Typography;

const MIN_DIST_TEXT = 'This controls how tightly the embedding is allowed to compress points together. '
  + 'Larger values ensure embedded points are more evenly distributed, while '
  + 'smaller values allow the algorithm to optimise more accurately with regard '
  + 'to local structure. Expected range: 0.001 to 1. Default is 0.3.';

const EMBEDD_METHOD_TEXT = 'Reducing the dimensionality does lose some information and there are several methods available. '
  + 'PCA (Principal component analysis) is fast and preserves the global structure of the data, whereas nonlinear techniques '
  + 'such as t-SNE and UMAP are very effective for visualizing clusters or groups of data points and their relative proximities.'
  + 'It is usually a good idea to have a look at both types. '
  + 't-SNE and UMAP are stochastic and very much dependent on choice of parameters (t-SNE even more than UMAP) and can yield very different results in different runs. ';

const CalculationConfig = (props) => {
  const { experimentId, onPipelineRun, onConfigChange } = props;
  const FILTER_UUID = 'configureEmbedding';
  const dispatch = useDispatch();

  const data = useSelector((state) => state.experimentSettings.processing[FILTER_UUID]);
  const changedQCFilters = useSelector(
    (state) => state.experimentSettings.processing.meta.changedQCFilters,
  );

  const { method: clusteringMethod } = data?.clusteringSettings || {};
  const { method: embeddingMethod } = data?.embeddingSettings || {};
  const { umap: umapSettings, tsne: tsneSettings } = data?.embeddingSettings.methodSettings || {};
  const { louvain: louvainSettings } = data?.clusteringSettings.methodSettings || {};

  const debouncedCellSetClustering = useCallback(
    _.debounce((resolution) => dispatch(runCellSetsClustering(experimentId, resolution)), 1500),
    [],
  );

  const [resolution, setResolution] = useState(null);
  const [minDistance, setMinDistance] = useState(null);

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
      // applied until they hit Run.
      onConfigChange();
    } else {
      // If it's a clustering change, debounce the save process at 1.5s.
      dispatchDebounce(saveProcessingSettings(experimentId, FILTER_UUID));
    }

    dispatch(updateFilterSettings(
      FILTER_UUID,
      diff,
    ));
  };

  const setMinimumDistance = (value) => {
    updateSettings({
      embeddingSettings: {
        methodSettings: {
          umap: {
            minimumDistance: parseFloat(value),
          },
        },
      },
    });

    onConfigChange();
  };
  const setDistanceMetric = (value) => {
    updateSettings({
      embeddingSettings: {
        methodSettings: {
          umap: {
            distanceMetric: parseFloat(value),
          },
        },
      },
    });

    onConfigChange();
  };

  const setLearningRate = (value) => {
    updateSettings({
      embeddingSettings: {
        methodSettings: {
          tsne: {
            learningRate: parseFloat(value),
          },
        },
      },
    });

    onConfigChange();
  };
  const setPerplexity = (value) => {
    updateSettings({
      embeddingSettings: {
        methodSettings: {
          tsne: {
            perplexity: parseFloat(value),
          },
        },
      },
    });

    onConfigChange();
  };

  const renderUMAPSettings = () => (
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
          min={0}
          step={0.1}
          onChange={(value) => setMinimumDistance(value)}
          onStep={(value) => setMinimumDistance(value)}
          onPressEnter={(e) => e.preventDefault()}
          onBlur={(e) => setMinimumDistance(e.target.value)}
        />
      </Form.Item>
      <Form.Item label={(
        <span>
          Distance metric&nbsp;
          <Tooltip overlay={(
            <span>
              A metric determines how similarity between cells is measured.
              "Euclidean" is the standard for most normalized datasets.
              Cosine might be a good choice for unnormalized data.
              More information
              <a
                href='https://satijalab.org/seurat/reference/runumap'
                target='_blank'
                rel='noreferrer'
              >
                {' '}
                <code>here</code>
              </a>
            </span>
          )}
          >
            <QuestionCircleOutlined />
          </Tooltip>
        </span>
      )}
      >
        <Select
          value={umapSettings.distanceMetric}
          onChange={(value) => setDistanceMetric(value)}
        >
          <Option value='euclidean'>Euclidean</Option>
          <Option value='cosine' disabled>
            {' '}
            <Tooltip title='Cosine metric is going to be supported on a future version of the platform.'>
              Cosine
            </Tooltip>
          </Option>
        </Select>
      </Form.Item>
    </>
  );

  const renderTSNESettings = () => (
    <>
      <Form.Item>
        <Text strong>Settings for t-SNE:</Text>
      </Form.Item>
      <Form.Item label='Perplexity'>
        <InputNumber
          value={tsneSettings.perplexity}
          min={5}
          onChange={(value) => setPerplexity(value)}
          onStep={(value) => setPerplexity(value)}
          onPressEnter={(e) => e.preventDefault()}
          onBlur={(e) => setPerplexity(e.target.value)}
        />
        <Tooltip title='Determines how to much emphasis should be on local or global aspects of your data.
          The parameter is, in a sense, a guess about the number of close neighbors each cell has.
          In most implementations, perplexity defaults to 30. This focuses the attention of t-SNE on preserving the
          distances to its 30 nearest neighbors and puts virtually no weight on preserving distances to the remaining points.
          The perplexity value has a complex effect on the resulting pictures.'
        >
          <QuestionCircleOutlined />
        </Tooltip>
      </Form.Item>
      <Form.Item label='Learning rate'>
        <InputNumber
          value={tsneSettings.learningRate}
          min={10}
          max={1000}
          step={10}
          onChange={(value) => setLearningRate(value)}
          onStep={(value) => setLearningRate(value)}
          onPressEnter={(e) => e.preventDefault()}
          onBlur={(e) => setLearningRate(e.target.value)}
        />
        <Tooltip title='If the learning rate is too high, the data may look like a "ball" with any point approximately equidistant from its nearest neighbours.
          If the learning rate is too low, most points may look compressed in a dense cloud with few outliers. usually in the range [10.0, 1000.0]'
        >
          <QuestionCircleOutlined />
        </Tooltip>
      </Form.Item>
    </>
  );

  if (!data) {
    return <PreloadContent />;
  }

  return (
    <Collapse defaultActiveKey={['embedding-settings', 'clustering-settings']}>
      <Panel header='Embedding settings' key='embedding-settings'>
        <Form size='small'>
          {Boolean(changedQCFilters.size) && (
            <Form.Item>
              <Alert message='Your changes are not yet applied. To update the plots, click Run.' type='warning' showIcon />
            </Form.Item>
          )}

          <Form.Item label={(
            <span>
              Method&nbsp;
              <Tooltip overlay={(
                <span>
                  {EMBEDD_METHOD_TEXT}
                  More info for
                  <a
                    href='https://satijalab.org/seurat/reference/runumap'
                    target='_blank'
                    rel='noreferrer'
                  >
                    {' '}
                    <code>UMAP</code>
                    {' '}
                  </a>
                  or
                  <a
                    href='https://satijalab.org/seurat/reference/runtsne'
                    target='_blank'
                    rel='noreferrer'
                  >
                    {' '}
                    <code>t-SNE</code>
                  </a>
                </span>
              )}
              >
                <QuestionCircleOutlined />
              </Tooltip>
            </span>
          )}
          >
            <Select
              value={embeddingMethod}
              onChange={(value) => {
                updateSettings({
                  embeddingSettings: {
                    method: value,
                  },
                });
              }}
            >
              <Option value='umap'>UMAP</Option>
              <Option value='tsne'>t-SNE</Option>
            </Select>

          </Form.Item>
          {embeddingMethod === 'umap' && renderUMAPSettings()}
          {embeddingMethod === 'tsne' && renderTSNESettings()}

          <Form.Item>
            <Tooltip title={!changedQCFilters.size ? 'No outstanding changes' : ''}>
              <Button
                type='primary'
                htmlType='submit'
                disabled={!changedQCFilters.size}
                onClick={() => onPipelineRun()}
                size='medium'
              >
                Run
              </Button>
            </Tooltip>
          </Form.Item>
        </Form>
      </Panel>
      <Panel header='Clustering settings' key='clustering-settings'>
        <Form size='small'>
          <Form.Item label={(
            <span>
              Clustering method&nbsp;
              <Tooltip overlay={(
                <span>
                  Louvain and Leiden are graph-based clustering methods which are the most popular
                  clustering algorithm in scRNA-seq data analysis since they have been reported to have outperformed other
                  clustering methods in many situations.
                  They are also more efficient than other cluster methods which is crucial large scRNA-seq datasets.
                  <a
                    href='https://en.wikipedia.org/wiki/Louvain_method'
                    target='_blank'
                    rel='noreferrer'
                  >
                    {' '}
                    <code>here</code>
                  </a>
                </span>
              )}
              >
                <QuestionCircleOutlined />
              </Tooltip>
            </span>
          )}
          >
            <Select
              value={clusteringMethod}
              onChange={(value) => updateSettings(
                { clusteringSettings: { method: value } },
              )}
            >
              <Option value='louvain'>Louvain</Option>
              <Option value='leiden' disabled>
                <Tooltip title='Leiden metric is going to be supported on a future version of the platform.'>
                  Leiden
                </Tooltip>
              </Option>
              <Option value='slm' disabled>
                <Tooltip title='SLM metric is going to be supported on a future version of the platform.'>
                  SLM
                </Tooltip>
              </Option>
            </Select>
          </Form.Item>
          <Form.Item label={(
            <span>
              Resolution&nbsp;
              <Tooltip overlay={(
                <span>
                  Resolution is a parameter for the Louvain community detection algorithm that affects the size of the recovered clusters.
                  Smaller resolutions recover smaller, and therefore more clusters,
                  and conversely, larger values recover fewer clusters containing more data points.
                  Default: 0.8
                </span>
              )}
              >
                <QuestionCircleOutlined />
              </Tooltip>
            </span>
          )}
          >
            <SliderWithInput
              min={0}
              max={2}
              step={0.1}
              value={resolution}
              onUpdate={(value) => {
                if (value === resolution) { return; }

                setResolution(value);
                updateSettings({
                  clusteringSettings: {
                    methodSettings: {
                      louvain: { resolution: value },
                    },
                  },
                });

                debouncedCellSetClustering(value);
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
  onConfigChange: PropTypes.func.isRequired,
  onPipelineRun: PropTypes.func.isRequired,
};

export default CalculationConfig;
