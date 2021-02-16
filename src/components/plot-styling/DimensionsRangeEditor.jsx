import _ from 'lodash';
import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Space,
} from 'antd';

const DimensionsRangeEditor = (props) => {
  const {
    onUpdate, config, maxHeight, maxWidth,
  } = props;

  const minWidth = 400;
  const widthMarks = {};
  widthMarks[minWidth] = minWidth;
  widthMarks[maxWidth] = maxWidth;

  const minHeight = 200;
  const heighthMarks = {};
  heighthMarks[minHeight] = minHeight;
  heighthMarks[maxHeight] = maxHeight;
  const onUpdateThrottled = useCallback(_.throttle((obj) => onUpdate(obj), 1000), []);
  const [newConfig, setNewConfig] = useState(config);
  const handleChange = (object) => {
    const change = _.cloneDeep(newConfig);
    _.merge(change, object);
    setNewConfig(change);
    onUpdateThrottled(object);
  };

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      Dimensions

      <Form.Item
        label='Width'
      >
        <Slider
          value={newConfig.dimensions.width}
          min={minWidth}
          max={maxWidth}
          onChange={(value) => {
            handleChange({ dimensions: { width: value } });
          }}
          marks={widthMarks}
        />
      </Form.Item>
      <Form.Item
        label='Height'
      >
        <Slider
          value={newConfig.dimensions.height}
          min={minHeight}
          max={maxHeight}
          onChange={(value) => {
            handleChange({ dimensions: { height: value } });
          }}
          marks={heighthMarks}
        />
      </Form.Item>
    </Space>
  );
};

DimensionsRangeEditor.defaultProps = {
  maxHeight: 1000,
  maxWidth: 1200,
};

DimensionsRangeEditor.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  maxHeight: PropTypes.number,
  maxWidth: PropTypes.number,
};

export default DimensionsRangeEditor;
