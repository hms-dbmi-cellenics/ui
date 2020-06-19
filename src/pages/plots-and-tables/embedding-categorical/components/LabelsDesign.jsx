import React, { useState } from 'react';

import {
  Radio, Form, Slider
} from 'antd';


const LabelsDesign = (props) => {

  const { config, onUpdate } = props;

  const [labelsEnabled, setlabelsEnabled] = useState(true);


  const onChange = (e) => {
    setlabelsEnabled(e.target.value);
    onUpdate({ labelsEnabled: e.target.value });
  };

  return (
    <>
      <Radio.Group onChange={onChange} value={labelsEnabled}>
        <Radio value>Show</Radio>
        <Radio value={false}>Hide</Radio>
      </Radio.Group>

      <Form.Item
        label='Size'
      >
        <Slider
          defaultValue={28}
          min={5}
          max={50}
          onAfterChange={(value) => {
            onUpdate({ labelSize: value });
          }}
        />
      </Form.Item>
    </>
  );
};

export default LabelsDesign;
