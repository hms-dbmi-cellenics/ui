import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Modal, Typography, Space, Button,
} from 'antd';

import { getUserFriendlyQCStepName } from '../utils/qcSteps';

const { Text } = Typography;

const ChangesNotAppliedModal = (props) => {
  const {
    onRunPipeline, onDiscardChanges, onCloseModal,
  } = props;

  const changedQCFilters = useSelector(
    (state) => state.experimentSettings.processing.meta.changedQCFilters,
  );

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
            onClick={() => onRunPipeline()}
            style={{ width: '100px' }}
          >
            Run
          </Button>
          <Button
            type='primary'
            key='discard'
            onClick={() => onDiscardChanges()}
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
          {changedQCFilters.size && (
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
