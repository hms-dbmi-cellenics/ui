import React, { useState } from 'react';

import {
  Radio,
} from 'antd';


const LegendEditor = (props) => {
  const { config, onUpdate } = props;

  const [legendEnabled, setLegendEnabled] = useState(false);

  const legend = [
    {
      fill: 'color',
      encode: {
        title: {
          update: {
            fontSize: { value: 14 },
          },
        },
        labels: {
          interactive: true,
          update: {
            fontSize: { value: 12 },
            fill: { value: 'black' },
          },
          hover: {
            fill: { value: 'firebrick' },
          },
        },
        symbols: {
          update: {
            stroke: { value: 'transparent' },
          },
        },
        legend: {
          update: {
            stroke: { value: '#ccc' },
            strokeWidth: { value: 1.5 },
          },
        },
      },
    },
  ];

  const onChange = (e) => {
    setLegendEnabled(e.target.value);
    if (e.target.value) {
      onUpdate({ legendEnabled: e.target.value, legend });
    } else {
      onUpdate({ legendEnabled: e.target.value, legend: null });
    }
  };

  return (
    <Radio.Group onChange={onChange} value={legendEnabled}>
      <Radio value>Show</Radio>
      <Radio value={false}>Hide</Radio>
    </Radio.Group>
  );
};

export default LegendEditor;
