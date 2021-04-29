import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form, InputNumber, Select, Tooltip, Typography } from 'antd';

import {
  QuestionCircleOutlined,
} from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

const SeuratV4Options = (props) => {
  const { config, onUpdate, onChange } = props;

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
                seuratv4: {
                  numGenes: value,
                },
              },
            },
          })}
          onBlur={(e) => onUpdate({
            dataIntegration: {
              methodSettings: {
                seuratv4: {
                  numGenes: parseInt(e.target.value, 0),
                },
              },
            },
          })}
        />
        {/* Identifies features that are outliers on a 'mean variability plot'.
        FindVariableGenes calculates the variance and mean for each gene in the dataset in the dataset (storing this in object@hvg.info), and sorts genes by their variance/mean ratio (VMR) */}
        <Tooltip title='Number of genes to mark as top highly variable genes (HGV). 
        Integration as well as PCA is based on a sensible selection of HGV.
        Here, this number selects the top variable genes based on the "vst" method. 
        The default 2000 has been found to be a sensible for many cases.
        Further info to be found here: https://satijalab.org/seurat/articles/integration_introduction.html'>
          <QuestionCircleOutlined />
        </Tooltip>
      </Form.Item>
      <Form.Item label='normalization'>
        <Select
          value={config.normalization}
          onChange={(val) => onUpdate({
            dataIntegration: {
              methodSettings: {
                seuratv4: { normalization: val },
              },
            },
          })}
        >
          <Option value='logNormalize'>LogNormalize</Option>
          <Option value='scTransform'>SCTransform</Option>
        </Select>
        <Tooltip title='Normalization aims to remove technical factors including sequencing depth. 
        There are several methods to achive normalization.
        "sctransform" claims to recover sharper biological distinction compared to log-normalization.
        Normalization is applied to each sample before integration.
        Further info here: https://satijalab.org/seurat/articles/sctransform_vignette.html'>
          <QuestionCircleOutlined />
        </Tooltip>
      </Form.Item>
    </>
  );
};

SeuratV4Options.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onChange: PropTypes.func,
};

SeuratV4Options.defaultProps = {
  onChange: null,
};

export default SeuratV4Options;
