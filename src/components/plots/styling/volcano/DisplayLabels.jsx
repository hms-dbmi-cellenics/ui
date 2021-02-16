import _ from 'lodash';
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Space,
} from 'antd';

const VolcanoDimensionsRangeEditor = (props) => {
  const {
    config, onUpdate, min, max,
  } = props;
  const onUpdateThrottled = useRef(_.throttle((obj) => onUpdate(obj), 10));

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <p><strong>Display Gene Labels Above (-log10 pvalue)</strong></p>

        <Form.Item
          label='Width'
        >
          <>  </>
          <Slider
            value={config.textThresholdValue}
            min={min}
            max={max}
            onChange={(value) => {
              onUpdateThrottled.current({ textThresholdValue: value });
            }}
          />
        </Form.Item>
      </Form>
    </Space>
  );
};

VolcanoDimensionsRangeEditor.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
};

export default VolcanoDimensionsRangeEditor;
