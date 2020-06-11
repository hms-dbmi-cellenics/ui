import React, { useState } from 'react';

import {
  Slider, Form, Input,

} from 'antd';

const AxesDesign = (props) => {
  const { onUpdate, config } = props;

  return (
    <>

      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
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
          label='Offset Margins'
        >
          <Slider
            defaultValue={10}
            min={0}
            max={20}
            onAfterChange={(value) => {
              onUpdate({ axesOffset: value });
            }}
          />
        </Form.Item>

        <Form.Item
          label='Grid-line weight'
        >
          <Slider
            defaultValue={0}
            min={0}
            max={10}
            onAfterChange={(value) => {
              onUpdate({ transGrid: value });
            }}
          />
        </Form.Item>

        <Form.Item
          label='X axis Title'
        >
          <Input
            placeholder='Enter x axis title'
            onPressEnter={(e) => {
              const { value } = e.target;
              onUpdate({ xaxisText: value });
            }}

          />

        </Form.Item>
        <Form.Item
          label='Y Axis Title'
        >
          <Input

            placeholder='Enter y axis title'
            onPressEnter={(e) => {
              const { value } = e.target;
              onUpdate({ yaxisText: value });
            }}

          />

        </Form.Item>
      </Form>
    </>
  );
};

export default AxesDesign;
