import React, { useState } from 'react';

import {
  Slider, Form,
  Radio, Collapse,
} from 'antd';
import PropTypes from 'prop-types';

import ColorBrowser from '../../components/ColorBrowser';

const ColourPicker = (props) => {
  const { onUpdate, config } = props;

  const [radioval, setradioval] = useState(config.pointstyle);

  const onChange = (e) => {
    console.log('radio checked', e.target.value);
    setradioval(e.target.value);
    onUpdate({ pointstyle: e.target.value });
  };
  const colorPickerOptions = [
    {
      config: 'g1Color',
      name: 'G1',
    },
    {
      config: 'g2mColor',
      name: 'G2M',
    },
    {
      config: 'sColor',
      name: 'S',
    },

  ];


  return (
    <>

      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div>Styles</div>


        <Form.Item
          label='Colors'
        >
          <ColorBrowser onUpdate={onUpdate} colorPickerOptions={colorPickerOptions} config={config} />
        </Form.Item>

      </Form>
    </>
  );
};
ColourPicker.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default ColourPicker;
