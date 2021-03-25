import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Space,
  Form,
  Button,
  Alert,
  Radio,
} from 'antd';

import _ from 'lodash';

import { updateProcessingSettings } from '../../redux/actions/experimentSettings';

const CalculationConfigContainer = (props) => {
  const {
    filterUuid, experimentId, sampleId, plotType, sampleIds, onConfigChange, children,
  } = props;

  const { auto, filterSettings: config } = useSelector(
    (state) => state.experimentSettings.processing[filterUuid][sampleId]
      || state.experimentSettings.processing[filterUuid],
  );

  const dispatch = useDispatch();

  const [displayIndividualChangesWarning, setDisplayIndividualChangesWarning] = useState(false);

  const updateAllSettings = () => {
    setDisplayIndividualChangesWarning(false);

    const newConfig = {};
    sampleIds.forEach((currentSampleId) => {
      newConfig[currentSampleId] = { filterSettings: config, auto };
    });

    dispatch(updateProcessingSettings(
      experimentId,
      filterUuid,
      newConfig,
    ));

    onConfigChange();
  };

  const updateSettings = (diff) => {
    const newConfig = _.cloneDeep(config);
    _.merge(newConfig, diff);

    updateSample({ [sampleId]: { auto, filterSettings: newConfig } });
  };
  const updateAuto = (autoMode) => {
    updateSample({ [sampleId]: { auto: autoMode, filterSettings: config } });
  };
  const updateSample = (newSampleSettings) => {
    setDisplayIndividualChangesWarning(true);
    dispatch(updateProcessingSettings(
      experimentId,
      filterUuid,
      newSampleSettings,
    ));

    onConfigChange();
  };

  return (
    <div>
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

      <Radio.Group
        value={auto ? 'automatic' : 'manual'}
        onChange={(e) => { updateAuto(e.target.value === 'automatic'); }}
        style={{ marginTop: '5px', marginBottom: '30px' }}
      >
        <Radio value='automatic'>
          Automatic
        </Radio>
        <Radio value='manual'>
          Manual
        </Radio>
      </Radio.Group>

      {React.cloneElement(children, {
        config, plotType, updateSettings, disabled: auto,
      })}

      <Button onClick={updateAllSettings}>Copy to all samples</Button>
    </div>
  );
};
CalculationConfigContainer.propTypes = {
  children: PropTypes.any.isRequired,
  experimentId: PropTypes.string.isRequired,
  filterUuid: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  plotType: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
};

export default CalculationConfigContainer;
