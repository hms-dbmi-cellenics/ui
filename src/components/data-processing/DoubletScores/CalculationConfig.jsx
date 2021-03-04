import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Space,
  Slider,
  Form,
  Button,
  Alert,
} from 'antd';

import _ from 'lodash';

import BandwidthOrBinstep from '../ReadAlignment/PlotStyleMisc';

import { updateProcessingSettings } from '../../../redux/actions/experimentSettings';

const CalculationConfig = (props) => {
  const {
    experimentId, sampleId, sampleIds,
  } = props;

  const config = useSelector(
    (state) => state.experimentSettings.processing.doubletScores[sampleId]
      || state.experimentSettings.processing.doubletScores.filterSettings,
  );

  const FILTER_UUID = 'doubletScores';

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

  const filtering = false;

  return (
    <>
      <Space direction='vertical' style={{ width: '100%' }} />
      <Form.Item label='Probability threshold'>
        <Slider
          collapsible={!filtering ? 'disabled' : 'header'}
          value={config.probabilityThreshold}
          min={0}
          max={1}
          onChange={(val) => updateSettings({ probabilityThreshold: val })}
          step={0.05}
        />
      </Form.Item>
      <BandwidthOrBinstep
        config={config}
        onUpdate={updateSettings}
        type='bin step'
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
