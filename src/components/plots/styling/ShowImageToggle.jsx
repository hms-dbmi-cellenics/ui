import React from 'react';
import PropTypes from 'prop-types';
import { Form, Radio } from 'antd';

// Toggles whether the tissue (histology) image is shown beneath the
// segmentation overlay in spatial plots (writes config.showImage).
const ShowImageToggle = (props) => {
  const { config, onUpdate } = props;

  return (
    <Form.Item label='Tissue image'>
      <Radio.Group
        value={config.showImage ?? true}
        onChange={(e) => onUpdate({ showImage: e.target.value })}
      >
        <Radio value>Show</Radio>
        <Radio value={false}>Hide</Radio>
      </Radio.Group>
    </Form.Item>
  );
};

ShowImageToggle.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default ShowImageToggle;
