import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Space,
  Button,
  Alert,
  Radio,
} from 'antd';

import { updateFilterSettings, copyFilterSettingsToAllSamples, setSampleFilterSettingsAuto } from '../../redux/actions/experimentSettings';

const CalculationConfigContainer = (props) => {
  const {
    filterUuid, sampleId, plotType, sampleIds, onConfigChange, children, stepDisabled,
  } = props;
  const { auto, filterSettings: config } = useSelector(
    (state) => (state.experimentSettings.processing[filterUuid][sampleId]),
  );
  const dispatch = useDispatch();

  const [displayIndividualChangesWarning, setDisplayIndividualChangesWarning] = useState(false);

  const copySettingsToAllSamples = () => {
    setDisplayIndividualChangesWarning(false);
    dispatch(
      copyFilterSettingsToAllSamples(
        filterUuid,
        sampleId,
        sampleIds,
      ),
    );
    onConfigChange();
  };

  const onFilterSettingsChange = () => {
    setDisplayIndividualChangesWarning(true);
    onConfigChange();
  };

  return (
    <div>
      <Space direction='vertical' style={{ width: '100%' }} />
      {displayIndividualChangesWarning && sampleIds.length > 1 && (
        <Alert
          message='To copy these new settings to the rest of your samples, click Copy to all samples.'
          type='info'
          showIcon
        />
      )}

      <Radio.Group
        value={auto ? 'automatic' : 'manual'}
        onChange={(e) => {
          onFilterSettingsChange();
          dispatch(setSampleFilterSettingsAuto(filterUuid, sampleId, e.target.value === 'automatic'));
        }}
        style={{ marginTop: '5px', marginBottom: '30px' }}
        disabled={stepDisabled}
      >
        <Radio value='automatic'>
          Automatic
        </Radio>
        <Radio value='manual'>
          Manual
        </Radio>
      </Radio.Group>

      {React.cloneElement(children, {
        config,
        plotType,
        updateSettings: (diff) => {
          dispatch(updateFilterSettings(filterUuid, diff, sampleId));
          onFilterSettingsChange();
        },
        disabled: stepDisabled || auto,
      })}

      {
        sampleIds.length > 1 ? (
          <Button onClick={copySettingsToAllSamples} disabled={auto === 'automatic'}>Copy to all samples</Button>
        ) : <></>
      }

    </div>
  );
};
CalculationConfigContainer.propTypes = {
  children: PropTypes.any.isRequired,
  filterUuid: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  plotType: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
};

CalculationConfigContainer.defaultProps = {
  stepDisabled: false,
};

export default CalculationConfigContainer;
