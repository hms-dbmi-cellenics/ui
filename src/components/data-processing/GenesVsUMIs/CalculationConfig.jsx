import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Space,
  InputNumber,
  Form,
  Button,
  Alert,
  Radio,
  Tooltip,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import _ from 'lodash';

import { updateProcessingSettings } from '../../../redux/actions/experimentSettings';

const CalculationConfig = (props) => {
  const {
    experimentId, sampleId, sampleIds, onConfigChange,
  } = props;

  const { auto, filterSettings: config } = useSelector(
    (state) => state.experimentSettings.processing.numGenesVsNumUmis[sampleId]
      || state.experimentSettings.processing.numGenesVsNumUmis,
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

    onConfigChange();
  };

  const updateSettings = (diff) => {
    const newConfig = _.cloneDeep(config);

    if (!_.has(diff, 'auto')) {
      _.merge(newConfig, diff);
    }

    const sampleSpecificDiff = {
      [sampleId]: {
        auto: diff?.auto ? diff.auto : auto,
        filterSettings: newConfig,
      },
    };

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
        defaultValue={auto}
        style={{ marginTop: '5px', marginBottom: '30px' }}
        onChange={(e) => (updateSettings({ auto: e.target.value }))}
      >
        <Radio value>
          Automatic
        </Radio>
        <Radio value={false}>
          Manual
        </Radio>
      </Radio.Group>
      <Form.Item label='p-level cut-off'>
        <Space direction='horizontal'>
          <Tooltip title='Linear regression (Gam) of UMIs vs features (genes) is performed for all cells in order to detect outliers. The ‘p-level cut-off’ is the stringency for defining outliers: ‘p.level’ refers to the confidence level for a given cell to deviate from the main trend. The smaller the number the more stringent cut-off.
‘p.level’ sets the prediction intervals calculated by the R `predict.lm` whereas `level = 1 - p.value`. The underlying regression is performed with `MASS::rlm`'
          >
            <InfoCircleOutlined />
          </Tooltip>
          <InputNumber
            value={config.regressionTypeSettings.gam['p.level']}
            onChange={(value) => updateSettings({ regressionTypeSettings: { gam: { 'p.level': value } } })}
            onPressEnter={(e) => updateSettings({ regressionTypeSettings: { gam: { 'p.level': e.target.value } } })}
            placeholder={0.00001}
            min={0}
            max={1}
            step={0.00001}
          />
        </Space>
      </Form.Item>
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
