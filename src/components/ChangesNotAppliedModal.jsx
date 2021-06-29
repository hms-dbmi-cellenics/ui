import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal, Typography, Space, Button,
} from 'antd';

const { Text } = Typography;

const ChangesNotAppliedModal = (props) => {
  const {
    visible, onRun, onDiscard, onCancel,
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
        <Space>
          <Text>
            Your new settings are not yet applied.
            Would you like to rerun data processing with
            these new settings, or discard the changes?
          </Text>
        </Space>
      </center>
    </Modal>

  );
};

ChangesNotAppliedModal.propTypes = {
  visible: PropTypes.bool,
  onRun: PropTypes.func.isRequired,
  onDiscard: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};

ChangesNotAppliedModal.defaultProps = {
  visible: false,
  onCancel: null,
};

export default ChangesNotAppliedModal;
