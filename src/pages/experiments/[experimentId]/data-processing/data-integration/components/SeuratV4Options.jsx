import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form, InputNumber, Select } from 'antd';

const { Option } = Select;

const SeuratV4Options = (props) => {
  const { config, onUpdate, onChange } = props;

  const [numGenes, setNumGenes] = useState(config.numGenes);

  return (
    <>
      <Form.Item label='# of genes:'>
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
      </Form.Item>
      <Form.Item label='Normalisation:'>
        <Select
          value={config.normalisation}
          onChange={(val) => onUpdate({
            dataIntegration: {
              methodSettings: {
                seuratv4: { normalisation: val },
              },
            },
          })}
        >
          <Option value='logNormalise'>LogNormalise</Option>
          <Option value='scTransform'>SCTransform</Option>
        </Select>
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
