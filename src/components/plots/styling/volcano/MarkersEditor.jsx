import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'antd';
import ColorBrowser from '../ColorBrowser';

const MarkersEditor = (props) => {
  const { onUpdate, config } = props;

  const colorPickerOptions = [
    {
      config: 'significantDownregulatedColor',
      name: 'Significantly downregulated genes',
    },
    {
      config: 'significantUpregulatedColor',
      name: 'Significantly upregulated genes',
    },
    {
      config: 'noDifferenceColor',
      name: 'Genes with no significant difference',
    },
  ];

  return (
    <Form
      size='small'
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
    >
      <p><strong>Markers</strong></p>
      <Form.Item
        label='Colors'
      >
        <ColorBrowser onUpdate={onUpdate} colorPickerOptions={colorPickerOptions} config={config} />
      </Form.Item>
    </Form>
  );
};

MarkersEditor.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default MarkersEditor;
