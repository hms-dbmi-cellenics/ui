import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal, Typography, Space, Button,
} from 'antd';

import getUserFriendlyQCStepName from '../utils/getUserFriendlyQCStepName';

const { Text } = Typography;

const ChangesNotAppliedModal = (props) => {
  const {
    steps, visible, onRun, onDiscard, onCancel,
  } = props;

  return (
    <Modal
      visible={visible}
      title='Changes not applied'
      onCancel={onCancel}
      footer={(
        <Space size='large' style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            type='primary'
            key='run'
            onClick={onRun}
            style={{ width: '100px' }}
          >
            Run
          </Button>
          <Button
            type='primary'
            key='discard'
            onClick={onDiscard}
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
          {steps && (
          <>
            <br />
            <ul style={{ margin: '0 auto', display: 'table' }}>
              {Array.from(steps).map((step) => (
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
  steps: PropTypes.any,
  visible: PropTypes.bool,
  onRun: PropTypes.func.isRequired,
  onDiscard: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};

ChangesNotAppliedModal.defaultProps = {
  steps: null,
  visible: false,
  onCancel: null,
};

export default ChangesNotAppliedModal;
