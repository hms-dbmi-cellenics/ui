import _ from 'lodash';
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Space,
} from 'antd';

const DimensionsRangeEditorVolcano = (props) => {
  const {
    width,
    height,
    xRange,
    yRange,
    xMax,
    yMax,
    onUpdateWidth,
    onUpdateHeight,
    onUpdateYAxisRange,
    onUpdateXAxisRange,
  } = props;

  const onUpdateWidthThrottled = useRef(_.throttle((val) => { onUpdateWidth(val); }, 10));
  const onUpdateHeightThrottled = useRef(_.throttle((val) => { onUpdateHeight(val); }, 10));
  const onUpdateYAxisRangeThrottled = useRef(_.throttle((val) => { onUpdateYAxisRange(val); }, 10));
  const onUpdateXAxisRangeThrottled = useRef(_.throttle((val) => { onUpdateXAxisRange(val); }, 10));

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
            value={width}
            min={200}
            max={1000}
            onChange={(val) => onUpdateWidthThrottled.current(val)}
          />
        </Form.Item>
        <Form.Item
          label='Height'
        >
          <Slider
            value={height}
            min={200}
            max={1000}
            onChange={(val) => onUpdateHeightThrottled.current(val)}
          />
        </Form.Item>
        <Form.Item
          label='X-axis Range'
        >
          <Slider
            value={yRange}
            min={0}
            max={yMax}
            onChange={(val) => onUpdateYAxisRangeThrottled.current(val)}
          />
        </Form.Item>
        <Form.Item
          label='Y-axis Range'
        >
          <Slider
            value={xRange}
            min={0}
            max={xMax}
            onChange={(val) => onUpdateXAxisRangeThrottled.current(val)}
          />
        </Form.Item>
      </Form>
    </Space>
  );
};

DimensionsRangeEditorVolcano.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  xRange: PropTypes.number,
  yRange: PropTypes.number,
  onUpdateWidth: PropTypes.func.isRequired,
  onUpdateHeight: PropTypes.func.isRequired,
  onUpdateYAxisRange: PropTypes.func.isRequired,
  onUpdateXAxisRange: PropTypes.func.isRequired,
  yMax: PropTypes.number.isRequired,
  xMax: PropTypes.number.isRequired,
};

DimensionsRangeEditorVolcano.defaultProps = {
  width: 500,
  height: 500,
  xRange: 0,
  yRange: 50,
};

export default DimensionsRangeEditorVolcano;
