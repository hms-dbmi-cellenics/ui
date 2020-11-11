import _ from 'lodash';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Radio, Form, Slider,
} from 'antd';

const LabelsDesign = (props) => {
  const { config, onUpdate } = props;
  const [labelsEnabled, setlabelsEnabled] = useState(true);
  const onUpdateThrottled = _.throttle(onUpdate, 20);

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
          value={config.labelSize}
          min={minLabelSize}
          max={maxLabelSize}
          disabled={!labelsEnabled}
          onChange={(value) => {
            onUpdateThrottled({ labelSize: value });
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
