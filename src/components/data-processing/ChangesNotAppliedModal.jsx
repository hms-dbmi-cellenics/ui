import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Modal, Typography, Space, Button,
} from 'antd';

import config from 'config';

import { getBackendStatus } from 'redux/selectors';
import { discardChangedQCFilters } from 'redux/actions/experimentSettings';
import { runQC } from 'redux/actions/pipeline';

import QCRerunDisabledModal from 'components/modals/QCRerunDisabledModal';
import { getUserFriendlyQCStepName } from 'utils/qcSteps';
import isUserAuthorized from 'utils/isUserAuthorized';
import { getURL } from 'redux/actions/pipeline/runQC';

const { Text } = Typography;

const ChangesNotAppliedModal = (props) => {
  const {
    onRunQC, onDiscardChanges, onCloseModal,
  } = props;

  const experimentId = useSelector(
    (state) => state.experimentSettings.info.experimentId,
  );

  const changedQCFilters = useSelector(
    (state) => state.experimentSettings.processing.meta.changedQCFilters,
  );

  const pipelineVersion = useSelector((state) => state.experimentSettings.info.pipelineVersion);

  const {
    status: backendStatus,
  } = useSelector(getBackendStatus(experimentId));

  const [runQCAuthorized, setRunQCAuthorized] = useState(null);

  const shouldRerun = backendStatus?.gem2s?.shouldRerun;

  const dispatch = useDispatch();

  const [QCDisabledModalVisible, setQCDisabledModalVisible] = useState(false);

  const runQCIfPossible = async () => {
    const oldQCVersion = pipelineVersion < config.pipelineVersionToRerunQC;

    if (oldQCVersion || !runQCAuthorized) {
      setQCDisabledModalVisible(true);
    } else {
      dispatch(runQC(experimentId));
      onRunQC();
    }
  };

  const closeModals = () => {
    setQCDisabledModalVisible(false);
    onCloseModal();
  };

  useEffect(() => {
    isUserAuthorized(experimentId, getURL(experimentId), 'POST').then(setRunQCAuthorized);
  }, []);

  return (
    <>
      {QCDisabledModalVisible && (
        <QCRerunDisabledModal
          experimentId={experimentId}
          onFinish={closeModals}
          visible={QCDisabledModalVisible}
          runQCAuthorized={runQCAuthorized}
        />
      )}
      <Modal
        title='Changes not applied'
        onCancel={() => onCloseModal()}
        open={!QCDisabledModalVisible}
        footer={(
          <Space size='large' style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              type='primary'
              key='run'
              disabled={!experimentId || !shouldRerun}
              onClick={() => {
                runQCIfPossible();
              }}
              style={{ width: '100px' }}
            >
              Run
            </Button>
            <Button
              type='primary'
              key='discard'
              onClick={() => {
                dispatch(discardChangedQCFilters());
                onDiscardChanges();
              }}
              style={{ width: '100px' }}
            >
              Discard
            </Button>
          </Space>
        )}
      >
        <center>
          <Space direction='vertical'>
            Your changes to the settings of these filters are not yet applied:
            {changedQCFilters.size > 0 && (
              <>
                <br />
                <ul style={{ margin: '0 auto', display: 'table' }}>
                  {Array.from(changedQCFilters).map((step) => (
                    <li>
                      <b style={{ float: 'left' }}>
                        {getUserFriendlyQCStepName(step)}
                      </b>
                    </li>
                  ))}
                </ul>

                <br />
              </>
            )}
            <Text>
              Would you like to rerun data processing with
              these new settings, or discard the changes?
            </Text>
          </Space>
        </center>
      </Modal>
    </>
  );
};

ChangesNotAppliedModal.propTypes = {
  onRunQC: PropTypes.func,
  onDiscardChanges: PropTypes.func,
  onCloseModal: PropTypes.func,
};

ChangesNotAppliedModal.defaultProps = {
  onRunQC: null,
  onDiscardChanges: null,
  onCloseModal: null,
};

export default ChangesNotAppliedModal;
