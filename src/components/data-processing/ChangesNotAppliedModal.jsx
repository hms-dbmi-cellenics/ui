import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Modal, Typography, Space, Button,
} from 'antd';

import { discardChangedQCFilters } from '../../redux/actions/experimentSettings';
import { runPipeline } from '../../redux/actions/pipeline';

import { getUserFriendlyQCStepName } from '../../utils/qcSteps';

const { Text } = Typography;

const ChangesNotAppliedModal = (props) => {
  const {
    onRunPipeline, onDiscardChanges, onCloseModal,
  } = props;

  const experimentId = useSelector(
    (state) => state.experimentSettings.info.experimentId,
  );

  const changedQCFilters = useSelector(
    (state) => state.experimentSettings.processing.meta.changedQCFilters,
  );

  const paramsHash = useSelector((state) => state.backendStatus[experimentId]?.status?.gem2s?.paramsHash);

  const dispatch = useDispatch();

  return (
    <Modal
      title='Changes not applied'
      onCancel={() => onCloseModal()}
      visible
      footer={(
        <Space size='large' style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            type='primary'
            key='run'
            onClick={() => {
              if (!experimentId || !paramsHash) return;
              dispatch(runPipeline(experimentId, paramsHash));
              onRunPipeline();
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
  );
};

ChangesNotAppliedModal.propTypes = {
  onRunPipeline: PropTypes.func,
  onDiscardChanges: PropTypes.func,
  onCloseModal: PropTypes.func,
};

ChangesNotAppliedModal.defaultProps = {
  onRunPipeline: null,
  onDiscardChanges: null,
  onCloseModal: null,
};

export default ChangesNotAppliedModal;
