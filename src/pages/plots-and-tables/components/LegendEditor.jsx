import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Radio } from 'antd';

const LegendEditor = (props) => {
  const { defaultState, onUpdate } = props;
  const [legendEnabled, setLegendEnabled] = useState(defaultState);
  const onChange = (e) => {
    setLegendEnabled(e.target.value);
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
  defaultState: PropTypes.bool.isRequired,
};

export default LegendEditor;
