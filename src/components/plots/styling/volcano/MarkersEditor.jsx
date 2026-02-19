import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'antd';
import ColorPicker from '../../../ColorPicker';

const MarkersEditor = (props) => {
  const { onUpdate, config } = props;

  const colorPickerOptions = [
    {
      config: 'significantDownregulatedColor',
      name: 'Downregulated',
    },
    {
      config: 'significantUpregulatedColor',
      name: 'Upregulated',
    },
    {
      config: 'noDifferenceColor',
      name: 'No difference',
    },
  ];

  return (
    <Form
      size='small'
      labelCol={{ span: 8, style: { textAlign: 'left' } }}
      wrapperCol={{ span: 16 }}
    >
      <p><strong>Markers</strong></p>
      {colorPickerOptions.map(({ config: configName, name: text }) => (
        <Form.Item
          key={`${configName}-${config[configName]}`}
          label={`${text}:`}
        >
          <ColorPicker
            onColorChange={((color) => {
              onUpdate({
                [configName]: color,
              });
            })}
            color={config[configName]}
            size='small'
          />
        </Form.Item>
      ))}
    </Form>
  );
};

MarkersEditor.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default MarkersEditor;
