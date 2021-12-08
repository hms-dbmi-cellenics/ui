import React from 'react';
import propTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import {
  Modal, Typography, Space, Button,
} from 'antd';
import { runGem2s } from 'redux/actions/pipeline';
import { useRouter } from 'next/router';

const { Text } = Typography;

const DataManagementIntercept = (props) => {
  const {
    onContinueNavigation, onDismissIntercept, rerunStatus, experimentId,
  } = props;
  const dispatch = useDispatch();
  const router = useRouter();
  return (
    <Modal
      title='Changes not applied'
      visible
      onCancel={() => onDismissIntercept()}
      footer={(
        <Space size='large' style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            type='primary'
            key='run'
            onClick={() => {
              onContinueNavigation();
              onDismissIntercept();
            }}
          >
            Continue with old data
          </Button>
          <Button
            type='primary'
            key='discard'
            onClick={() => {
              dispatch(runGem2s(experimentId, rerunStatus.paramsHash));
              const analysisPath = '/experiments/[experimentId]/data-processing';
              router.push(analysisPath.replace('[experimentId]', experimentId));
              onDismissIntercept();
            }}
          >
            Re-run sample processing
          </Button>
        </Space>
      )}
    >
      <center>
        <Space direction='vertical'>
          You have made changes that require data to be processed again.
          <Text>
            Would you like to discard these changes and navigate to the page using old data or re-run sample processing?
          </Text>
        </Space>
      </center>
    </Modal>
  );
};

DataManagementIntercept.propTypes = {
  onContinueNavigation: propTypes.func.isRequired,
  onDismissIntercept: propTypes.func.isRequired,
  rerunStatus: propTypes.object.isRequired,
  experimentId: propTypes.string.isRequired,
};
export default DataManagementIntercept;
