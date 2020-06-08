import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Form,
  Radio,
} from 'antd';

const InvertColours = (props) => {
  const { onUpdate, config } = props;

  const [toggleInvert, settoggleInvert] = useState(config.toggleInvert);

  const onChange = (e) => {
    console.log('radio checked', e.target.value);
    settoggleInvert(e.target.value);
    onUpdate({ toggleInvert: e.target.value });
  };

  const [toggleAddInvert, settoggleAddInvert] = useState(config.masterColour);

  const onAddChange = (e) => {
    console.log('radio checked', e.target.value);
    settoggleAddInvert(e.target.value);
    onUpdate({ masterColour: e.target.value });
  };

  return (
    <Form
      size='small'
      labelCol={{ span: 12 }}
      wrapperCol={{ span: 12 }}
    >
      <div>Background</div>
      <Form.Item>
        <Radio.Group onChange={onChange} value={toggleInvert}>
          <Radio value='#FFFFFF'>Standard</Radio>
          <Radio value='#000000'>Invert</Radio>
        </Radio.Group>
      </Form.Item>
      <div>Axes and Titles</div>
      <Form.Item>
        <Radio.Group onChange={onAddChange} value={toggleAddInvert}>
          <Radio value='#000000'>Standard</Radio>
          <Radio value='#FFFFFF'>Invert</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  );
};

InvertColours.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default InvertColours;
