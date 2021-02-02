import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio,
} from 'antd';

const ColourInversion = (props) => {
  const { onUpdate, value } = props;
  const options = {
    '#FFFFFF': 'Standard',
    '#000000': 'Invert',
  };

  console.log(value);

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <p><strong>Background</strong></p>
        <Form.Item>
          <Radio.Group onChange={(e) => onUpdate(e)} value={value}>

            {
              Object.entries(options).map(([val, text]) => (
                <Radio key={val} value={val}>{text}</Radio>
              ))
            }

          </Radio.Group>
        </Form.Item>
      </Form>
    </>
  );
};

ColourInversion.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  value: PropTypes.object.isRequired,
};

// Default implementation of color inversion
const invertColour = (value) => {
  if (value === '#FFFFFF') {
    return {
      colour: {
        toggleInvert: value,
        masterColour: '#000000',
        reverseColourBar: false,
      },
    };
  }
  return {
    colour: {
      toggleInvert: value,
      masterColour: '#FFFFFF',
      reverseColourbar: true,
    },
  };
};

export { invertColour };
export default ColourInversion;
