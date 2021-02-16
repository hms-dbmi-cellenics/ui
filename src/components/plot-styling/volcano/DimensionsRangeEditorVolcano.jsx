import _ from 'lodash';
import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Space,
} from 'antd';
import DimensionsRangeEditor from '../DimensionsRangeEditor';

const DimensionsRangeEditorVolcano = (props) => {
  const {
    config, onUpdate, yMax, xMax,
  } = props;
  const onUpdateThrottled = useCallback(_.throttle((obj) => onUpdate(obj), 70), []);
  const [newConfig, setNewConfig] = useState(config);
  const handleChange = (object) => {
    const change = _.cloneDeep(newConfig);
    _.merge(change, object);
    setNewConfig(change);
    onUpdateThrottled(object);
  };
  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <DimensionsRangeEditor
        config={config}
        onUpdate={onUpdate}
      />
      <Form.Item
        label='Y-axis Range'
      >
        <Slider
          value={yMax}
          min={0}
          max={yMax}
          onChange={(value) => {
            handleChange({ maxNegativeLogpValueDomain: value });
          }}
        />
      </Form.Item>
      <Form.Item
        label='X-axis Range'
      >
        <Slider
          value={xMax}
          min={0}
          max={xMax}
          onChange={(value) => {
            handleChange({ logFoldChangeDomain: value });
          }}
        />
      </Form.Item>

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
