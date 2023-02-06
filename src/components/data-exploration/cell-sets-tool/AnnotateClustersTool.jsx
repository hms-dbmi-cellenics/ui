import React, { useState } from 'react';
import _ from 'lodash';

import {
  Button,
  Radio, Select, Space,
} from 'antd';

const tissueTypeOptions = [
  'Immune system',
  'Pancreas',
  'Liver',
  'Eye',
  'Kidney',
  'Brain',
  'Lung',
  'Adrenal',
  'Heart',
  'Intestine',
  'Muscle',
  'Placenta',
  'Spleen',
  'Stomach',
  'Thymus',
];

const speciesOptions = [
  'human',
  'mouse',
];

const AnnotateClustersTool = () => {
  const [tissueType, setTissueType] = useState(null);
  const [species, setSpecies] = useState(null);

  return (
    <Space direction='vertical'>
      <Radio.Group>
        <Radio>ScType</Radio>
      </Radio.Group>

      <Space direction='vertical' style={{ width: '100%' }}>
        Tissue Type:
        <Select
          options={tissueTypeOptions.map((option) => ({ label: option, value: option }))}
          value={tissueType}
          placeholder='Select a tissue type'
          onChange={setTissueType}
        />
      </Space>

      <Space direction='vertical' style={{ width: '100%' }}>
        Species:
        <Select
          options={speciesOptions.map((option) => ({ label: option, value: option }))}
          value={species}
          placeholder='Select a species'
          onChange={setSpecies}
        />
      </Space>

      <Button disabled={_.isNil(tissueType) || _.isNil(species)} style={{ marginTop: '20px' }}>
        Compute
      </Button>
    </Space>
  );
};

AnnotateClustersTool.defaultProps = {};

AnnotateClustersTool.propTypes = {};

export default AnnotateClustersTool;
