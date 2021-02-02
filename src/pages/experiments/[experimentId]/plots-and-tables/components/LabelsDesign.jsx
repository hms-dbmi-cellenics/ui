import _ from 'lodash';
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Radio, Form, Slider,
} from 'antd';

const LabelsDesign = (props) => {
  const {
    enabled,
    size,
    onEnabledUpdate,
    onSizeUpdate,
  } = props;

  const minLabelSize = 0;
  const maxLabelSize = 50;

  const onSizeUpdateThrottled = useRef(_.throttle((val) => onSizeUpdate(val), 10));

  return (
    <>
      <Radio.Group onChange={(e) => onEnabledUpdate(e)} value={enabled}>
        <Radio value>Show</Radio>
        <Radio value={false}>Hide</Radio>
      </Radio.Group>

      {
        enabled && (
          <Form.Item
            label='Size'
          >
            <Slider
              value={size}
              min={minLabelSize}
              max={maxLabelSize}
              disabled={!enabled}
              onChange={(val) => onSizeUpdateThrottled.current(val)}
              marks={{ 0: minLabelSize, 50: maxLabelSize }}
            />
          </Form.Item>

        )
      }

    </>
  );
};

LabelsDesign.propTypes = {
  enabled: PropTypes.bool,
  size: PropTypes.number,
  onEnabledUpdate: PropTypes.func.isRequired,
  onSizeUpdate: PropTypes.func.isRequired,
};

LabelsDesign.defaultProps = {
  enabled: true,
  size: 28,
};

export default LabelsDesign;
