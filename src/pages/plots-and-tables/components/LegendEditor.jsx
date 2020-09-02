import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Radio } from 'antd';

const LegendEditor = (props) => {
  const { onUpdate, legendConfig } = props;
  const [legendEnabled, setLegendEnabled] = useState(false);

  const onChange = (e) => {
    if (e.target.value === true) {
      onUpdate({ legend: legendConfig });
    } else {
      onUpdate({ legend: [] });
    }
    setLegendEnabled(e.target.value);
  };

  useEffect(() => {
    if (legendEnabled) {
      onUpdate({ legend: legendConfig });
    }
  }, [legendConfig[0].title]);

  return (
    <Radio.Group onChange={onChange} value={legendEnabled}>
      <Radio value>Show</Radio>
      <Radio value={false}>Hide</Radio>
    </Radio.Group>
  );
};

LegendEditor.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  legendConfig: PropTypes.array.isRequired,
};

export default LegendEditor;
