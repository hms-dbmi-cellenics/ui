import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Space,
  InputNumber,
  Form,
  Button,
  Alert,
  Slider,
  Select,
  Radio,
} from 'antd';

import _ from 'lodash';

import BandwidthOrBinstep from '../ReadAlignment/PlotStyleMisc';

import { updateProcessingSettings } from '../../../redux/actions/experimentSettings';

const { Option } = Select;

const CalculationConfig = (props) => {
  const {
    experimentId, sampleId, sampleIds, configChangedHandler,
  } = props;

  const config = useSelector(
    (state) => state.experimentSettings.processing.numGenesVsNumUmis[sampleId]?.filterSettings
      || state.experimentSettings.processing.numGenesVsNumUmis.filterSettings,
  );

  const FILTER_UUID = 'numGenesVsNumUmis';

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

    configChangedHandler();
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

    configChangedHandler();
  };

  const filtering = false;

  return (
    <>
      <Space direction='vertical' style={{ width: '100%' }} />
      <Radio.Group defaultValue={1} style={{ marginTop: '5px', marginBottom: '30px' }}>
        <Radio value={1}>
          Automatic
        </Radio>
        <Radio value={2}>
          Manual
        </Radio>
      </Radio.Group>
      <Form.Item
        label='Regression type:'
      >
        <Select
          value={config.regressionType}
          style={{ width: 200 }}
          collapsible={!filtering ? 'disabled' : 'header'}
        >
          <Option value='gam'>Gam</Option>
          <Option value='option2'>option2</Option>
          <Option value='option3'>option3</Option>
        </Select>
      </Form.Item>
      <Form.Item
        label='Smoothing:'
      >
        <Slider
          collapsible={!filtering ? 'disabled' : 'header'}
          value={config.smoothing}
          min={5}
          max={21}
          onChange={(val) => updateSettings({ smoothing: val })}
        />
      </Form.Item>
      <Form.Item
        label='Upper cut-off:'
      >
        <Slider
          value={config.upperCutoff}
          collapsible={!filtering ? 'disabled' : 'header'}
          min={2}
          max={5}
          onChange={(val) => updateSettings({ upperCutoff: val })}
          step={0.1}
        />
      </Form.Item>
      <Form.Item
        label='Lower cut-off:'
      >
        <Slider
          defaultValue={config.lowerCutoff}
          collapsible={!filtering ? 'disabled' : 'header'}
          min={2}
          max={5}
          onChange={(val) => updateSettings({ lowerCutoff: val })}
          step={0.1}
        />
      </Form.Item>
      <Form.Item label='Stringency'>
        <InputNumber
          collapsible={!filtering ? 'disabled' : 'header'}
          max={5}
          min={0}
          step={0.1}
          onChange={(val) => updateSettings({ stringency: val })}
          value={config.stringency}
        />
      </Form.Item>
      <BandwidthOrBinstep
        config={config}
        onUpdate={updateSettings}
        type='bin step'
      />
      <Button onClick={updateAllSettings}>Apply settings to all samples</Button>
      {displayIndividualChangesWarning && (
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
  configChangedHandler: PropTypes.func.isRequired,
};

export default CalculationConfig;
