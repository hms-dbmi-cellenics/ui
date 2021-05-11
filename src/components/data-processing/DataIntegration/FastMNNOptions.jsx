import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form, InputNumber, Select, Tooltip, Typography } from 'antd';

import {
  QuestionCircleOutlined,
} from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

const FastMNNOptions = (props) => {
  const {
    config, onUpdate, onChange, disabled,
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
                fastmnn: {
                  numGenes: value,
                },
              },
            },
          })}
          onBlur={(e) => onUpdate({
            dataIntegration: {
              methodSettings: {
                fastmnn: {
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
              Normalization aims to remove technical factors including sequencing depth.
              There are several methods to achive normalization.
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
                fastmnn: { normalization: val },
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

FastMNNOptions.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onChange: PropTypes.func,
};

FastMNNOptions.defaultProps = {
  onChange: null,
};

export default FastMNNOptions;
