import React, {
  useState, useEffect, useMemo, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import {
  Form, Radio, Slider, InputNumber, Space,
} from 'antd';
import _ from 'lodash';

import SliderWithInput from '../../SliderWithInput';

const LOCAL_OUTLIER = 'localOutlier';
const ABSOLUTE_THRESHOLD = 'absoluteThreshold';

const isSet = (bound) => bound !== null && bound !== undefined;

// Two-handle slider on a log10 scale for a minimum and an optional maximum
// count. Dragging the max handle all the way right means "no maximum" (null).
const LogRangeThreshold = (props) => {
  const {
    min, max, dataRange, onUpdate, disabled,
  } = props;

  const [lowPos, highPos] = [Math.log10(Math.max(dataRange[0], 1)), Math.log10(dataRange[1])];
  const toPos = (x) => _.clamp(Math.log10(Math.max(x, 1)), lowPos, highPos);
  const fromPos = (pos) => Math.round(10 ** pos);

  const [local, setLocal] = useState({ min, max });
  useEffect(() => { setLocal({ min, max }); }, [min, max]);

  const debouncedUpdate = useCallback(_.debounce(onUpdate, 400), [onUpdate]);
  useEffect(() => () => debouncedUpdate.cancel(), [debouncedUpdate]);

  const update = (newBounds) => {
    setLocal(newBounds);
    debouncedUpdate(newBounds);
  };

  const sliderValue = [
    isSet(local.min) ? toPos(local.min) : lowPos,
    isSet(local.max) ? toPos(local.max) : highPos,
  ];

  return (
    <Space direction='vertical'>
      <Slider
        range
        min={lowPos}
        max={highPos}
        step={(highPos - lowPos) / 200 || 0.01}
        value={sliderValue}
        tooltip={{ formatter: (pos) => fromPos(pos) }}
        onChange={([newLow, newHigh]) => update({
          min: fromPos(newLow),
          max: newHigh >= highPos ? null : fromPos(newHigh),
        })}
        disabled={disabled}
        style={{ width: 280, margin: '0.5em' }}
      />
      <Space>
        <InputNumber
          addonBefore='Min'
          min={0}
          value={local.min}
          onChange={(value) => update({ ...local, min: value })}
          disabled={disabled}
          style={{ width: 130 }}
        />
        <InputNumber
          addonBefore='Max'
          min={0}
          placeholder='none'
          value={local.max}
          onChange={(value) => update({ ...local, max: value })}
          disabled={disabled}
          style={{ width: 140 }}
        />
      </Space>
    </Space>
  );
};

LogRangeThreshold.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number,
  dataRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  onUpdate: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

LogRangeThreshold.defaultProps = {
  min: null,
  max: null,
};

// Settings for the spatial QC metric filters. The method can be a spatial
// local outlier (z-score cutoff) or an absolute threshold on the raw metric:
// a min/max range for UMIs and genes, a max percent for mitochondrial content.
// Direction is fixed per filter, not user-editable.
const SpatialOutlierCalculationConfig = (props) => {
  const {
    config, disabled, stepDisabled, updateSettings,
    direction, metricLabel, rawRange, methods,
  } = props;

  const method = config.method ?? LOCAL_OUTLIER;
  const settings = config.methodSettings?.[method] ?? {};

  const updateMethodSettings = (diff) => updateSettings({
    methodSettings: { [method]: diff },
  });

  const dataRange = useMemo(() => {
    const [low, high] = rawRange ?? [1, 1e5];
    return [Math.max(low, 1), Math.max(high, low + 1, 10)];
  }, [rawRange]);

  const renderAbsolute = () => {
    if (direction === 'upper') {
      return (
        <Form.Item label={`Max ${metricLabel}`}>
          <SliderWithInput
            min={0}
            max={100}
            step={0.5}
            value={settings.max ?? 100}
            onUpdate={(newValue) => updateMethodSettings({ max: newValue })}
            disabled={disabled}
          />
        </Form.Item>
      );
    }

    return (
      <Form.Item label={metricLabel}>
        <LogRangeThreshold
          min={settings.min}
          max={settings.max}
          dataRange={dataRange}
          onUpdate={(bounds) => updateMethodSettings(bounds)}
          disabled={disabled}
        />
      </Form.Item>
    );
  };

  const isLogScale = method === ABSOLUTE_THRESHOLD && direction === 'lower';

  return (
    <>
      {methods.length > 1 && (
        <Form.Item label='Method'>
          <Radio.Group
            value={method}
            onChange={(e) => updateSettings({ method: e.target.value })}
            disabled={stepDisabled}
          >
            <Radio value={LOCAL_OUTLIER}>Local outlier (z-score)</Radio>
            <Radio value={ABSOLUTE_THRESHOLD}>Absolute threshold</Radio>
          </Radio.Group>
        </Form.Item>
      )}
      {method === LOCAL_OUTLIER ? (
        <Form.Item label='Z-score threshold'>
          <SliderWithInput
            min={0}
            max={10}
            step={0.5}
            value={settings.cutoff}
            onUpdate={(newValue) => updateMethodSettings({ cutoff: newValue })}
            disabled={disabled}
          />
        </Form.Item>
      ) : renderAbsolute()}
      <Form.Item label={isLogScale ? 'Bin step (log10)' : 'Bin step'}>
        <SliderWithInput
          min={isLogScale ? 0.01 : 0.05}
          max={isLogScale ? 0.5 : 10}
          step={isLogScale ? 0.01 : 0.05}
          value={settings.binStep}
          onUpdate={(newValue) => updateMethodSettings({ binStep: newValue })}
          disabled={disabled}
        />
      </Form.Item>
    </>
  );
};

SpatialOutlierCalculationConfig.defaultProps = {
  updateSettings: () => {},
  config: {},
  disabled: false,
  stepDisabled: false,
  rawRange: null,
  methods: [LOCAL_OUTLIER, ABSOLUTE_THRESHOLD],
};

SpatialOutlierCalculationConfig.propTypes = {
  updateSettings: PropTypes.func,
  config: PropTypes.object,
  disabled: PropTypes.bool,
  stepDisabled: PropTypes.bool,
  direction: PropTypes.oneOf(['lower', 'upper']).isRequired,
  metricLabel: PropTypes.string.isRequired,
  rawRange: PropTypes.arrayOf(PropTypes.number),
  methods: PropTypes.arrayOf(PropTypes.oneOf([LOCAL_OUTLIER, ABSOLUTE_THRESHOLD])),
};

export default SpatialOutlierCalculationConfig;
export { LOCAL_OUTLIER, ABSOLUTE_THRESHOLD };
