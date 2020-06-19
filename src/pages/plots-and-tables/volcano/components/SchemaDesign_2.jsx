import React, { useState } from 'react';

import {
  Slider, Form
} from 'antd';


const SchemaDesign = (props) => {

  const { onUpdate } = props;


  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div>Dimensions</div>

        <Form.Item
          label='Width'
        >
          <Slider
            defaultValue={500}
            min={200}
            max={1000}
            onAfterChange={(value) => {
              onUpdate({ width: value });
            }}
          />
        </Form.Item>
        <Form.Item
          label='Height'
        >
          <Slider
            defaultValue={500}
            min={200}
            max={1000}
            onAfterChange={(value) => {
              onUpdate({ height: value });
            }}
          />
        </Form.Item>

        <Form.Item
          label='Y-axis Range'
        >
          <Slider
            defaultValue={60}
            min={0}
            max={props.yMax}
            onAfterChange={(value) => {
              onUpdate({ maxNegativeLogpValueDomain: value });
            }}
          />
        </Form.Item>
        <Form.Item
          label='X-axis Range'
        >
          <Slider
            defaultValue={25}
            min={0}
            max={props.xMax}
            onAfterChange={(value) => {
              onUpdate({ logFoldChangeDomain: value });
            }}
          />
        </Form.Item>


      </Form>
    </>
  );
};

export default SchemaDesign;
