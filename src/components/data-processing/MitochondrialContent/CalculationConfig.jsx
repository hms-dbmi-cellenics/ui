import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Space,
  Select,
  Slider,
  Form,
  Button,
  Alert,
  Radio,
} from 'antd';

import _ from 'lodash';

import BandwidthOrBinstep from '../ReadAlignment/PlotStyleMisc';

import { updateProcessingSettings } from '../../../redux/actions/experimentSettings';

const { Option } = Select;

const CalculationConfig = (props) => {
  const {
    experimentId, sampleId, sampleIds, onConfigChange,
  } = props;

  const config = useSelector(
    (state) => state.experimentSettings.processing.mitochondrialContent[sampleId]?.filterSettings
      || state.experimentSettings.processing.mitochondrialContent.filterSettings,
  );

  const FILTER_UUID = 'mitochondrialContent';

  const dispatch = useDispatch();

  const [displayIndividualChangesWarning, setDisplayIndividualChangesWarning] = useState(false);

  const updateAllSettings = () => {
    setDisplayIndividualChangesWarning(false);

    const newConfig = {};
    sampleIds.forEach((currentSampleId) => {
      newConfig[currentSampleId] = { filterSettings: config };
    });

    dispatch(updateProcessingSettings(
      experimentId,
      FILTER_UUID,
      newConfig,
    ));

    onConfigChange();
  };

  const updateSettingsForActiveMethod = (diff) => {
    const realDiff = { methodSettings: { [activeMethod]: diff } };

    const newConfig = _.cloneDeep(config);
    _.merge(newConfig, realDiff);

    const sampleSpecificDiff = { [sampleId]: { filterSettings: newConfig } };

    setDisplayIndividualChangesWarning(true);
    dispatch(updateProcessingSettings(
      experimentId,
      FILTER_UUID,
      sampleSpecificDiff,
    ));

    onConfigChange();
  };

  const filtering = false;

  return (
    <>
      <Space direction='vertical' style={{ width: '100%' }} />
      {displayIndividualChangesWarning && (
        <Form.Item>
          <Alert
            message='To copy these new settings to the rest of your samples, click Copy to all samples.'
            type='info'
            showIcon
          />
        </Form.Item>
      )}
      <Radio.Group defaultValue={1} style={{ marginTop: '5px', marginBottom: '30px' }}>
        <Radio value={1}>
          Automatic
        </Radio>
        <Radio value={2}>
          Manual
        </Radio>
      </Radio.Group>
      <Form.Item label='Maximum percentage'>
        <Slider
          value={config.methodSettings[activeMethod].maxFraction}
          min={0}
          max={100}
          step={0.05}
          collapsible={!filtering ? 'disabled' : 'header'}
          onChange={(val) => updateSettingsForActiveMethod({ maxFraction: val })}
        />
      </Form.Item>
      <BandwidthOrBinstep
        config={config.methodSettings[activeMethod]}
        onUpdate={updateSettingsForActiveMethod}
        type='bin step'
        min={0.1}
        max={10}
      />
      <Button onClick={updateAllSettings}>Copy to all samples</Button>
    </>
  );
};

CalculationConfig.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
};

export default CalculationConfig;
