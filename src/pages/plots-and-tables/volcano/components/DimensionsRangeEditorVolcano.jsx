import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Space,
} from 'antd';


const DimensionsRangeEditorVolcano = (props) => {
  const {
    config, onUpdate, yMax, xMax,
  } = props;

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div>Dimensions</div>

        <Form.Item
          label='Width'
        >
          <Slider
            defaultValue={config.width}
            min={200}
            max={1000}
            onAfterChange={(value) => {
              onUpdate({ width: value });
            }}
          />
        </Form.Item>
        <Form.Item
          label='Height'
        >
          <Slider
            defaultValue={config.height}
            min={200}
            max={1000}
            onAfterChange={(value) => {
              onUpdate({ height: value });
            }}
          />
        </Form.Item>
        <Form.Item
          label='Y-axis Range'
        >
          <Slider
            defaultValue={yMax}
            min={0}
            max={yMax}
            onAfterChange={(value) => {
              onUpdate({ maxNegativeLogpValueDomain: value });
            }}
          />
        </Form.Item>
        <Form.Item
          label='X-axis Range'
        >
          <Slider
            defaultValue={xMax}
            min={0}
            max={xMax}
            onAfterChange={(value) => {
              onUpdate({ logFoldChangeDomain: value });
            }}
          />
        </Form.Item>


      </Form>
    </Space>
  );
};

DimensionsRangeEditorVolcano.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  yMax: PropTypes.number.isRequired,
  xMax: PropTypes.number.isRequired,
};

export default DimensionsRangeEditorVolcano;
