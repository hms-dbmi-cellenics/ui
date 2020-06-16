import React from 'react';
import PropTypes from 'prop-types';

import {
  Form
} from 'antd';

import ColorBrowser from '../../components/ColorBrowser';


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
      config: 'notSignificantDownregulatedColor',
      name: 'Insignificantly downregulated genes',
    },
    {
      config: 'notSignificantUpregulatedColor',
      name: 'Insignificantly upregulated genes',
    },
    {
      config: 'significantChangeDirectionUnknownColor',
      name: 'Significant genes, undetermined direction',
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
      <div>Markers</div>
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
