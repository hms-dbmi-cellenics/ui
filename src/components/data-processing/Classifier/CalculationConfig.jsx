import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Space,
  Form,
  Button,
  Alert,
  Slider,
  Radio,
} from 'antd';

import _ from 'lodash';

import BandwidthOrBinstep from '../ReadAlignment/PlotStyleMisc';

import { updateProcessingSettings } from '../../../redux/actions/experimentSettings';

const CalculationConfig = (props) => {
  const {
    experimentId, sampleId, sampleIds, onConfigChange,
  } = props;

  const config = useSelector(
    (state) => state.experimentSettings.processing.classifier[sampleId]?.filterSettings
      || state.experimentSettings.processing.classifier.filterSettings,
  );

  const FILTER_UUID = 'classifier';

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

  const updateSettings = (diff) => {
    const newConfig = _.cloneDeep(config);
    _.merge(newConfig, diff);

    const sampleSpecificDiff = { [sampleId]: { filterSettings: newConfig } };

    setDisplayIndividualChangesWarning(true);
    dispatch(updateProcessingSettings(
      experimentId,
      FILTER_UUID,
      sampleSpecificDiff,
    ));

    onConfigChange();
  };

  return (
    <>
      {displayIndividualChangesWarning && (
        <Form.Item>
          <Alert
            message='Your changes are only applied to this sample. To apply it to all other samples, click Apply to all samples.'
            type='warning'
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
      <Button onClick={updateAllSettings}>Apply to all samples</Button>
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
