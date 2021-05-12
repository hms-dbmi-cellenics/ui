import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Form, InputNumber, Select, Tooltip, Typography,
} from 'antd';

import {
  QuestionCircleOutlined,
} from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

const NormalisationOptions = (props) => {
  const {
    config, onUpdate, onChange, disabled, methodId,
  } = props;

  const [numGenes, setNumGenes] = useState(config.numGenes);

  return (
    <>
      <Form.Item label='# of HGV genes'>
        <InputNumber
          value={numGenes}
          step={100}
          min={1}
          onChange={(value) => {
            onChange();
            setNumGenes(value);
          }}
          onPressEnter={(e) => e.preventDefault()}
          onStep={(value) => onUpdate({
            dataIntegration: {
              methodSettings: {
                [methodId]: {
                  numGenes: value,
                },
              },
            },
          })}
          onBlur={(e) => onUpdate({
            dataIntegration: {
              methodSettings: {
                [methodId]: {
                  numGenes: parseInt(e.target.value, 0),
                },
              },
            },
          })}
          disabled={disabled}
        />
        {' '}
        <Tooltip overlay={(
          <span>
            Number of genes to mark as top highly variable genes (HGV).
            Integration as well as PCA is based on a sensible selection of HGV.
            Here, this number selects the top variable genes based on the "vst" method.
            The default 2000 has been found to be a sensible for many cases.
            Further info can be found
            <a
              href='https://satijalab.org/seurat/articles/integration_introduction.html'
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
      </Form.Item>
      <Form.Item label={(
        <span>
          Normalization&nbsp;
          <Tooltip overlay={(
            <span>
              Normalization aims to remove technical factors, like sequencing depth for example.
              There are several methods to achieve normalization.
              "sctransform" claims to recover sharper biological distinction compared to log-normalization.
              Normalization is applied to each sample before integration.
              Further info can be found
              <a
                href='https://satijalab.org/seurat/articles/sctransform_vignette.html'
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
          value={config.normalization}
          onChange={(val) => onUpdate({
            dataIntegration: {
              methodSettings: {
                [methodId]: { normalization: val },
              },
            },
          })}
          disabled={disabled}
        >
          <Option value='logNormalize'>LogNormalize</Option>
          <Option value='scTransform'>SCTransform</Option>
        </Select>

      </Form.Item>
    </>
  );
};

NormalisationOptions.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
  methodId: PropTypes.oneOf(['seuratv4', 'unisample', 'fastmnn']).isRequired,
  onChange: PropTypes.func,
};

NormalisationOptions.defaultProps = {
  onChange: null,
};

export default NormalisationOptions;
