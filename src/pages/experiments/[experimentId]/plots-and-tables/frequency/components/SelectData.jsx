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

  const changeClusters = (val) => {
    onUpdate({ chosenClusters: val });
  };
  return (
    <>
      <Form.Item>
        <Select value={config.chosenClusters} onChange={(value) => changeClusters(value)}>
          <Option value='louvain'>Louvain clusters</Option>
          <Option value='scratchpad'>Scratchpad</Option>
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
