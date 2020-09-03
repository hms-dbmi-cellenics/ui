import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Input,
} from 'antd';

const AxesDesign = (props) => {
  const { onUpdate, config } = props;

  return (
    <Form
      size='small'
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 12 }}
    >
      <Form.Item label='Axes Label Size'>
        <Slider
          defaultValue={config.axisTitlesize}
          min={5}
          max={21}
          onAfterChange={(value) => {
            onUpdate({ axisTitlesize: value });
          }}
          marks={{ 5: 5, 21: 21 }}
        />
      </Form.Item>

      <Form.Item label='Axes Ticks Size'>
        <Slider
          defaultValue={config.axisTicks}
          min={5}
          max={21}
          onAfterChange={(value) => {
            onUpdate({ axisTicks: value });
          }}
          marks={{ 5: 5, 21: 21 }}
        />
      </Form.Item>

      <Form.Item label='Offset Margins'>
        <Slider
          defaultValue={config.axesOffset}
          min={0}
          max={20}
          onAfterChange={(value) => {
            onUpdate({ axesOffset: value });
          }}
          marks={{ 0: 0, 20: 20 }}
        />
      </Form.Item>

      <Form.Item label='Grid-line weight'>
        <Slider
          defaultValue={config.transGrid}
          min={0}
          max={10}
          onAfterChange={(value) => {
            onUpdate({ transGrid: value });
          }}
          marks={{ 0: 0, 10: 10 }}
        />
      </Form.Item>

      <Form.Item label='X axis Title'>
        <Input
          defaultValue={config.xaxisText}
          onPressEnter={(e) => {
            onUpdate({ xaxisText: e.target.value });
          }}
        />
      </Form.Item>

      <Form.Item label='Y Axis Title'>
        <Input
          defaultValue={config.yaxisText}
          onPressEnter={(e) => {
            const { value } = e.target;
            onUpdate({ yaxisText: value });
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
