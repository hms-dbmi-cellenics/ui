import _ from 'lodash';
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Input,
} from 'antd';

const AxesDesign = (props) => {
  const {
    xAxisText,
    yAxisText,
    labelSize,
    tickSize,
    offset,
    gridOpacity,
    onXAxisTextUpdate,
    onYAxisTextUpdate,
    onLabelSizeUpdate,
    onTickSizeUpdate,
    onOffsetUpdate,
    onGridOpacityUpdate,
  } = props;

  const onUpdateLabelSizeThrottled = useRef(_.throttle((val) => onLabelSizeUpdate(val), 10));
  const onUpdateTickSizeThrottled = useRef(_.throttle((val) => onTickSizeUpdate(val), 10));
  const onUpdateOffsetThrottled = useRef(_.throttle((val) => onOffsetUpdate(val), 10));
  const onUpdateGridOpacityThrottled = useRef(_.throttle((val) => onGridOpacityUpdate(val), 10));

  return (
    <Form
      size='small'
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 12 }}
    >

      <Form.Item label='X axis Title'>
        <Input
          value={xAxisText}
          onChange={(e) => onXAxisTextUpdate(e)}
        />
      </Form.Item>

      <Form.Item label='Y Axis Title'>
        <Input
          value={yAxisText}
          onChange={(e) => onYAxisTextUpdate(e)}
        />
      </Form.Item>
      <Form.Item label='Axes Label Size'>
        <Slider
          value={labelSize}
          min={5}
          max={21}
          onChange={(val) => onUpdateLabelSizeThrottled.current(val)}
          marks={{ 5: 5, 21: 21 }}
        />
      </Form.Item>

      <Form.Item label='Axes Ticks Size'>
        <Slider
          value={tickSize}
          min={5}
          max={21}
          onChange={(val) => onUpdateTickSizeThrottled.current(val)}
          marks={{ 5: 5, 21: 21 }}
        />
      </Form.Item>

      <Form.Item label='Offset Margins'>
        <Slider
          value={offset}
          min={0}
          max={20}
          onChange={(val) => onUpdateOffsetThrottled.current(val)}
          marks={{ 0: 0, 20: 20 }}
        />
      </Form.Item>

      <Form.Item label='Grid-line weight'>
        <Slider
          value={gridOpacity}
          min={0}
          max={10}
          onChange={(val) => onUpdateGridOpacityThrottled.current(val)}
          marks={{ 0: 0, 10: 10 }}
        />
      </Form.Item>
    </Form>
  );
};

AxesDesign.propTypes = {
  xAxisText: PropTypes.string,
  yAxisText: PropTypes.string,
  labelSize: PropTypes.number,
  tickSize: PropTypes.number,
  offset: PropTypes.number,
  gridOpacity: PropTypes.number,
  onXAxisTextUpdate: PropTypes.func.isRequired,
  onYAxisTextUpdate: PropTypes.func.isRequired,
  onLabelSizeUpdate: PropTypes.func.isRequired,
  onTickSizeUpdate: PropTypes.func.isRequired,
  onOffsetUpdate: PropTypes.func.isRequired,
  onGridOpacityUpdate: PropTypes.func.isRequired,
};

AxesDesign.defaultProps = {
  xAxisText: '',
  yAxisText: '',
  labelSize: 12,
  tickSize: 13,
  offset: 0,
  gridOpacity: 0,
};

export default AxesDesign;
