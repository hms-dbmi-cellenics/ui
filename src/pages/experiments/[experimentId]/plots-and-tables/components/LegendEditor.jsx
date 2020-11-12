import React from 'react';
import PropTypes from 'prop-types';
import { Radio } from 'antd';

const LegendEditor = (props) => {
  const { onUpdate, legendEnabled } = props;

  const onChange = (e) => {
    onUpdate({ legendEnabled: e.target.value });
  };

  return (
    <Radio.Group onChange={onChange} value={legendEnabled}>
      <Radio value>Show</Radio>
      <Radio value={false}>Hide</Radio>
    </Radio.Group>
  );
};

LegendEditor.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  legendEnabled: PropTypes.array.isRequired,
};

export default LegendEditor;
