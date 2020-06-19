import React, { useState } from 'react';

import {
  Radio,
} from 'antd';


const LegendEditor = (props) => {
  const { config, onUpdate } = props;

  const [legendLocation, setlegendLocation] = useState('horizontal');


  const onChange = (e) => {
    setlegendLocation(e.target.value);
    onUpdate({ legendLocation: e.target.value });
  };

  return (
    <Radio.Group onChange={onChange} value={legendLocation}>
      <Radio value='horizontal'>Horizontal</Radio>
      <Radio value='vertical'>Vertical</Radio>
      <Radio value='none'>Hide</Radio>
    </Radio.Group>
  );
};

export default LegendEditor;
