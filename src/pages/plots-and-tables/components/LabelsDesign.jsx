import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Radio, Form, Slider,
} from 'antd';


const LabelsDesign = (props) => {
  const { config, onUpdate } = props;
  const [labelsEnabled, setlabelsEnabled] = useState(true);

  const onChange = (e) => {
    setlabelsEnabled(e.target.value);
    onUpdate({ labelsEnabled: e.target.value, labelShow: e.target.value ? 1 : 0 });
  };

  const minLabelSize = 0;
  const maxLabelSize = 50;

  return (
    <>
      <Radio.Group onChange={onChange} value={labelsEnabled}>
        <Radio value>Show</Radio>
        <Radio value={false}>Hide</Radio>
      </Radio.Group>

      <Form.Item
        label='Size'
      >
        <Slider
          defaultValue={config.labelSize}
          min={minLabelSize}
          max={maxLabelSize}
          disabled={!labelsEnabled}
          onAfterChange={(value) => {
            onUpdate({ labelSize: value });
          }}
          marks={{ 0: minLabelSize, 50: maxLabelSize }}
        />
      </Form.Item>
    </>
  );
};

LabelsDesign.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default LabelsDesign;
