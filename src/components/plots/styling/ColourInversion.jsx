import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio,
} from 'antd';

const ColourInversion = (props) => {
  const { onUpdate, config } = props;
  const onChange = (e) => {
    if (e.target.value === '#FFFFFF') {
      onUpdate({ colour: { toggleInvert: e.target.value, masterColour: '#000000', reverseColourBar: false } });
    } else {
      onUpdate({ colour: { toggleInvert: e.target.value, masterColour: '#FFFFFF', reverseColourBar: true } });
    }
  };

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <p><strong>Background Color:</strong></p>
        <Form.Item>
          <Radio.Group onChange={onChange} value={config.colour.toggleInvert}>
            <Radio value='#FFFFFF'>Standard</Radio>
            <Radio value='#000000'>Invert</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </>
  );
};

ColourInversion.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default ColourInversion;
