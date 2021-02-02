import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'antd';
import ColorBrowser from '../../components/ColorBrowser';

const MarkersEditor = (props) => {
  const {
    significantDownregulatedColor,
    significantUpregulatedColor,
    notSignificantDownregulatedColor,
    notSignificantUpregulatedColor,
    significantChangeDirectionUnknownColor,
    noDifferenceColor,
    OnSignificantDownregulatedColorUpdate,
    OnSignificantUpregulatedColorUpdate,
    OnNotSignificantDownregulatedColorUpdate,
    OnNotSignificantUpregulatedColorUpdate,
    OnSignificantChangeDirectionUnknownColorUpdate,
    OnNoDifferenceColorUpdate,
  } = props;

  const colorPickerOptions = [
    {
      key: 'significantDownregulatedColor',
      text: 'Significantly downregulated genes',
      colourValue: significantDownregulatedColor,
      colourHandler: OnSignificantDownregulatedColorUpdate,
    },
    {
      key: 'significantUpregulatedColor',
      text: 'Significantly upregulated genes',
      colourValue: significantUpregulatedColor,
      colourHandler: OnSignificantUpregulatedColorUpdate,
    },
    {
      key: 'notSignificantDownregulatedColor',
      text: 'Insignificantly downregulated genes',
      colourValue: notSignificantDownregulatedColor,
      colourHandler: OnNotSignificantDownregulatedColorUpdate,
    },
    {
      key: 'notSignificantUpregulatedColor',
      text: 'Insignificantly upregulated genes',
      colourValue: notSignificantUpregulatedColor,
      colourHandler: OnNotSignificantUpregulatedColorUpdate,
    },
    {
      key: 'significantChangeDirectionUnknownColor',
      text: 'Significant genes, either direction',
      colourValue: significantChangeDirectionUnknownColor,
      colourHandler: OnSignificantChangeDirectionUnknownColorUpdate,
    },
    {
      key: 'noDifferenceColor',
      text: 'Genes with no measured difference',
      colourValue: noDifferenceColor,
      colourHandler: OnNoDifferenceColorUpdate,
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
        <ColorBrowser
          colorPickerOptions={colorPickerOptions}
          width={300}
        />
      </Form.Item>
    </Form>
  );
};

MarkersEditor.propTypes = {
  significantDownregulatedColor: PropTypes.string,
  significantUpregulatedColor: PropTypes.string,
  notSignificantDownregulatedColor: PropTypes.string,
  notSignificantUpregulatedColor: PropTypes.string,
  significantChangeDirectionUnknownColor: PropTypes.string,
  noDifferenceColor: PropTypes.string,
  OnSignificantDownregulatedColorUpdate: PropTypes.func.isRequired,
  OnSignificantUpregulatedColorUpdate: PropTypes.func.isRequired,
  OnNotSignificantDownregulatedColorUpdate: PropTypes.func.isRequired,
  OnNotSignificantUpregulatedColorUpdate: PropTypes.func.isRequired,
  OnSignificantChangeDirectionUnknownColorUpdate: PropTypes.func.isRequired,
  OnNoDifferenceColorUpdate: PropTypes.func.isRequired,
};

MarkersEditor.defaultProps = {
  significantDownregulatedColor: '#ff0000',
  significantUpregulatedColor: '#0000ffaa',
  notSignificantDownregulatedColor: '#aaaaaa',
  notSignificantUpregulatedColor: '#aaaaaa',
  significantChangeDirectionUnknownColor: '#aaaaaa',
  noDifferenceColor: '#aaaaaa',
};

export default MarkersEditor;
