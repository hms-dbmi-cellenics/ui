import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Form,
  Button,
  Alert,
  InputNumber,
  Radio,
  Tooltip,
  Space,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import _ from 'lodash';

import { updateProcessingSettings } from '../../../redux/actions/experimentSettings';

const CalculationConfig = (props) => {
  const {
    experimentId, sampleId, sampleIds, onConfigChange,
  } = props;

  const { auto, filterSettings: config } = useSelector(
    (state) => state.experimentSettings.processing.classifier[sampleId]
      || state.experimentSettings.processing.classifier,
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
      <Form.Item label='FDR'>
        <Space direction='horizontal'>
          <Tooltip overlay={(
            <span>
              False discovery rate (FDR) is calculated for each barcode by using the
              {' '}
              <a
                href='https://rdrr.io/github/MarioniLab/DropletUtils/man/emptyDrops.html'
                target='_blank'
                rel='noreferrer'
              >
                <code>emptyDrops</code>
                {' '}
                function
              </a>
              . This
              distinguishes between droplets containing cells and ambient RNA. The FDR range is
              [0-1]. The default FDR value is 0.01, where only barcodes with FDR &lt; 0.01
              are retained.
            </span>
          )}
          >
            <InfoCircleOutlined />
          </Tooltip>
          <InputNumber
            value={config.FDR}
            onChange={(value) => updateSettings({ FDR: value })}
            onPressEnter={(e) => updateSettings({ FDR: e.target.value })}
            placeholder={0.01}
            min={0}
            max={1}
            step={0.01}
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
