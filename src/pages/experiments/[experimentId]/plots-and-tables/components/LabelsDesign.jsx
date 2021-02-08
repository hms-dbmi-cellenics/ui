import _ from 'lodash';
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Radio, Form, Slider,
} from 'antd';

const LabelsDesign = (props) => {
  const { config, onUpdate } = props;

  const onUpdateThrottled = useRef(_.throttle((obj) => onUpdate(obj), 10));

  const minLabelSize = 0;
  const maxLabelSize = 50;

  return (
    <>
      <Radio.Group onChange={(e) => onUpdate({ label: { enabled: e.target.value } })} value={config.label.enabled}>
        <Radio value>Show</Radio>
        <Radio value={false}>Hide</Radio>
      </Radio.Group>

      <Form.Item
        label='Size'
      >
        <Slider
          value={config.label.size}
          min={minLabelSize}
          max={maxLabelSize}
          disabled={!config.label.enabled}
          onChange={(value) => {
            onUpdateThrottled.current({ label: { size: value } });
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
