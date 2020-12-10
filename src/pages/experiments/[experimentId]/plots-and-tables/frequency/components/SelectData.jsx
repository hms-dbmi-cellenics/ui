import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio,
  Select,
} from 'antd';

const { Option } = Select;
const SelectData = (props) => {
  const { onUpdate, config } = props;

  const changeData = (value) => 1;

  const changeClusters = (val) => {
    onUpdate({ chosenClusters: val });
  };
  return (
    <>
      <Form.Item>
        <Radio.Group onChange={(value) => changeData(value)} value={config.currentData}>
          <Radio value='sample'>Sample</Radio>
          <Radio value='metadata1'>Metadata 1</Radio>
          <Radio value='metadata2'>Metadata 2</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item>
        <Select value={config.chosenClusters} onChange={(value) => changeClusters(value)}>
          <Option value='louvain'>louvain</Option>
          <Option value='scratchpad'>scratchpad</Option>
        </Select>
      </Form.Item>
    </>
  );
};
SelectData.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};
export default SelectData;
