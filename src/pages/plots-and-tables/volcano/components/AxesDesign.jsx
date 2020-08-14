import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Input,
} from 'antd';

const AxesDesign = (props) => {
  const { onUpdate } = props;
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
          defaultValue={13}
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
          defaultValue={13}
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
          defaultValue={5}
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
          placeholder='Enter x-axis title'
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
          placeholder='Enter y-axis title'
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
};


export default AxesDesign;
