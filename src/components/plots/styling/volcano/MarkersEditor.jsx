import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'antd';
import ColorBrowser from '../ColorBrowser';

const VolcanoMarkersEditor = (props) => {
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
      config: 'notSignificantDownregulatedColor',
      name: 'Insignificantly downregulated genes',
    },
    {
      config: 'notSignificantUpregulatedColor',
      name: 'Insignificantly upregulated genes',
    },
    {
      config: 'significantChangeDirectionUnknownColor',
      name: 'Significant genes, either direction',
    },
    {
      config: 'noDifferenceColor',
      name: 'Genes with no measured difference',
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

VolcanoMarkersEditor.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default VolcanoMarkersEditor;
