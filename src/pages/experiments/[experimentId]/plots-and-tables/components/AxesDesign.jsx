import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Input,
} from 'antd';

const AxesDesign = (props) => {
  const { onUpdate, config } = props;
  const onUpdateThrottled = _.throttle((obj) => onUpdate(obj), 20);

  return (
    <Form
      size='small'
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 12 }}
    >
      <Form.Item label='Axes Label Size'>
        <Slider
          value={config.axisTitlesize}
          min={5}
          max={21}
          onChange={(value) => {
            onUpdateThrottled({ axisTitlesize: value });
          }}
          marks={{ 5: 5, 21: 21 }}
        />
      </Form.Item>

      <Form.Item label='Axes Ticks Size'>
        <Slider
          value={config.axisTicks}
          min={5}
          max={21}
          onChange={(value) => {
            onUpdateThrottled({ axisTicks: value });
          }}
          marks={{ 5: 5, 21: 21 }}
        />
      </Form.Item>

      <Form.Item label='Offset Margins'>
        <Slider
          value={config.axesOffset}
          min={0}
          max={20}
          onChange={(value) => {
            onUpdateThrottled({ axesOffset: value });
          }}
          marks={{ 0: 0, 20: 20 }}
        />
      </Form.Item>

      <Form.Item label='Grid-line weight'>
        <Slider
          value={config.transGrid}
          min={0}
          max={10}
          onChange={(value) => {
            onUpdateThrottled({ transGrid: value });
          }}
          marks={{ 0: 0, 10: 10 }}
        />
      </Form.Item>

      <Form.Item label='X axis Title'>
        <Input
          value={config.xaxisText}
          onChange={(e) => {
            onUpdateThrottled({ xaxisText: e.target.value });
          }}
        />
      </Form.Item>

      <Form.Item label='Y Axis Title'>
        <Input
          value={config.yaxisText}
          onChange={(e) => {
            const { value } = e.target;
            onUpdateThrottled({ yaxisText: value });
          }}
        />
      </Form.Item>
    </Form>
  );
};

AxesDesign.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default AxesDesign;
