import React from 'react';
import propTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Modal, Typography, Space, Button,
} from 'antd';
import calculateGem2sRerunStatus from 'utils/data-management/calculateGem2sRerunStatus';
import { runGem2s } from 'redux/actions/pipeline';

const { Text } = Typography;

const DataManagementIntercept = (props) => {
  const { onContinueNavigation } = props;
  const dispatch = useDispatch();
  const activeProjectUuid = useSelector((state) => state.projects.meta.activeProjectUuid);
  const experimentId = useSelector((state) => state.projects[activeProjectUuid].experiments[0]);
  const experiment = useSelector((state) => state.experiments[experimentId]);
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);
  const samples = useSelector((state) => state.samples);
  const gem2sBackendStatus = useSelector((state) => state.backendStatus[experimentId].status.gem2s);

  const rerunStatus = calculateGem2sRerunStatus(gem2sBackendStatus, activeProject, samples, experiment);
  console.log('rerun status is ', rerunStatus);
  if (rerunStatus.rerun) {
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
              onClick={() => onContinueNavigation()}
              style={{ width: '100px' }}
            >
              Continue
            </Button>
            <Button
              type='primary'
              key='discard'
              onClick={() => dispatch(runGem2s(experimentId, rerunStatus.paramsHash))}
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
  }
  return (<></>);
};

DataManagementIntercept.propTypes = {
  onContinueNavigation: propTypes.func.isRequired,
};
export default DataManagementIntercept;
