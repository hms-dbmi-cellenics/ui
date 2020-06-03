import React, { useState } from 'react';

import {
  Slider, Form,

} from 'antd';

const axesdesign = (props) => {
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
              onUpdate({ axistitlesize: value });
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
              onUpdate({ axisticks: value });
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
            defaultValue={5}
            min={1}
            max={10}
            onAfterChange={(value) => {
              onUpdate({ transGrid: value });
            }}
          />
        </Form.Item>


      </Form>
    </>
  );
};

export default axesdesign;
