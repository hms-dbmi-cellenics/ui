import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Input,
} from 'antd';

const AxesDesign = (props) => {
  const { config, onUpdate } = props;
  return (
    <Form
      size='small'
      labelCol={{ span: 12 }}
      wrapperCol={{ span: 12 }}
    >
      <div> Axes Styles </div>
      <Form.Item
        label='Axes Label Size'
      >
        <Slider
          defaultValue={config.axisTitlesize}
          min={5}
          max={21}
          onAfterChange={(value) => {
            onUpdate({ axisTitlesize: value });
          }}
        />
      </Form.Item>
      <Form.Item
        label='Axes Ticks Size'
      >
        <Slider
          defaultValue={config.axisTicks}
          min={5}
          max={21}
          onAfterChange={(value) => {
            onUpdate({ axisTicks: value });
          }}
        />
      </Form.Item>
      <Form.Item
        label='Grid-line weight'
      >
        <Slider
          defaultValue={config.transGrid}
          min={1}
          max={10}
          onAfterChange={(value) => {
            onUpdate({ transGrid: value });
          }}
        />
      </Form.Item>
      <div> Axes Titles </div>
      <Form.Item
        label='Edit x-axis'
      >
        <Input
          defaultValue={config.xaxisText}
          onPressEnter={(e) => {
            const { value } = e.target;
            onUpdate({ xaxisText: value });
          }}
        />
      </Form.Item>
      <Form.Item
        label='Edit y-axis'
      >
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
