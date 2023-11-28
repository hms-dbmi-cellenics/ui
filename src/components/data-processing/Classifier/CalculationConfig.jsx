import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  InputNumber,
  Tooltip,
  Space,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const ClassifierConfig = (props) => {
  const {
    config, disabled, updateSettings,
  } = props;

  return (
    <>
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
            min={0.00}
            max={1.00}
            step={0.01}
            disabled={disabled}
          />
        </Space>
      </Form.Item>
    </>
  );
};

ClassifierConfig.defaultProps = {
  updateSettings: () => {},
  config: {},
  disabled: false,
};

ClassifierConfig.propTypes = {
  updateSettings: PropTypes.func,
  config: PropTypes.object,
  disabled: PropTypes.bool,
};

export default ClassifierConfig;
