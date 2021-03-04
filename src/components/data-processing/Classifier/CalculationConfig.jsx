import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Space,
  Form,
  Button,
  Alert,
  Slider,
} from 'antd';

import _ from 'lodash';

import BandwidthOrBinstep from '../ReadAlignment/PlotStyleMisc';

import { updateProcessingSettings } from '../../../redux/actions/experimentSettings';

const CalculationConfig = (props) => {
  const {
    experimentId, sampleId, sampleIds,
  } = props;

  const config = useSelector(
    (state) => state.experimentSettings.processing.classifier[sampleId]
      || state.experimentSettings.processing.classifier.filterSettings,
  );

  const FILTER_UUID = 'classifier';

  const dispatch = useDispatch();

  const [individualChangesWarningEnabled, setIndividualChangesWarningEnabled] = useState(false);

  const updateAllSettings = () => {
    setIndividualChangesWarningEnabled(false);

    const newConfig = {};
    sampleIds.forEach((currentSampleId) => {
      newConfig[currentSampleId] = config;
    });

    dispatch(updateProcessingSettings(
      experimentId,
      FILTER_UUID,
      newConfig,
    ));
  };

  const updateSettings = (diff) => {
    const newConfig = _.cloneDeep(config);
    _.merge(newConfig, diff);

    const sampleSpecificDiff = {};
    sampleSpecificDiff[sampleId] = newConfig;

    setIndividualChangesWarningEnabled(true);
    dispatch(updateProcessingSettings(
      experimentId,
      FILTER_UUID,
      sampleSpecificDiff,
    ));
  };

  return (
    <>
      <Space direction='vertical' style={{ width: '100%' }} />
      <Form.Item label='Min probability:'>
        <Slider
          value={config.minProbability}
          min={0}
          max={1}
          onChange={(val) => updateSettings({ minProbability: val })}
          step={0.05}
        />
      </Form.Item>
      <BandwidthOrBinstep
        config={config}
        onUpdate={updateSettings}
        type='bandwidth'
      />
      <Button onClick={updateAllSettings}>Apply settings to all samples</Button>
      {individualChangesWarningEnabled && (
        <Form.Item>
          <Alert
            message='Your changes are only applied to this sample. To apply it to all other samples, click Apply settings to all samples.'
            type='warning'
            showIcon
          />
        </Form.Item>
      )}
    </>
  );
};

CalculationConfig.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
};

export default CalculationConfig;
