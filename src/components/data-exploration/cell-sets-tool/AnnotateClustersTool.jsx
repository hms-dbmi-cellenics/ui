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

const AnnotateClustersTool = () => {
  const [tissueType, setTissueType] = useState(null);

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

      <Button disabled={_.isNil(tissueType)}>
        Compute
      </Button>
    </Space>
  );
};

AnnotateClustersTool.defaultProps = {};

AnnotateClustersTool.propTypes = {
};

export default AnnotateClustersTool;
