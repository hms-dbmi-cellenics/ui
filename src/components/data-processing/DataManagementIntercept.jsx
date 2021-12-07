import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  Modal, Typography, Space, Button,
} from 'antd';
import calculateGem2sRerunStatus from 'utils/data-management/calculateGem2sRerunStatus';

const { Text } = Typography;

const DataManagementIntercept = (props) => {
  console.log('AYYLMAO');

  return (
    <Modal
      title='Changes not applied'
      // onCancel={() => onCloseModal()}
      visible
      footer={(
        <Space size='large' style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            type='primary'
            key='run'
            // onClick={() => {
            //   if (!experimentId || !paramsHash) return;
            //   dispatch(runPipeline(experimentId, paramsHash));
            //   onRunPipeline();
            // }}
            style={{ width: '100px' }}
          >
            Continue
          </Button>
          <Button
            type='primary'
            key='discard'
            // onClick={() => {
            //   dispatch(discardChangedQCFilters());
            //   onDiscardChanges();
            // }}
            style={{ width: '100px' }}
          >
            Re-process
          </Button>
        </Space>
      )}
    >
      <center>
        <Space direction='vertical'>
          You have made changes that need to be reprocessed again.
          <Text>
            Would you like to continue to the page or go through processing?
          </Text>
        </Space>
      </center>
    </Modal>
  );
};

export default DataManagementIntercept;
