import React, { useState } from 'react';

import {
  Radio,
} from 'antd';

const LegendEditor = (props) => {

  const { config, onUpdate } = props;

  const [legendEnabled, setLegendEnabled] = useState(props.defaultState);


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

export default LegendEditor;
