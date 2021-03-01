import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal, Button, Input, Space,
} from 'antd';

const NewProjectModal = (props) => {
  const { visible, onCreate, onCancel } = props;

  return (
    <Modal
      title=''
      visible={visible}
      footer={(
        <Button
          type='primary'
          key='create'
          block
          onClick={onCreate}
        >
          Create Project
        </Button>
      )}
      style={{ textAlign: 'center' }}
      onCancel={onCancel}
    >
      <Space align='center'>
        <Space direction='vertical' style={{ margin: '2rem 0 1rem 0' }}>
          <h3 style={{ textAlign: 'center' }}>Create a project to start analyzing your data with CellScope</h3>
          <Input />
        </Space>
      </Space>
    </Modal>

  );
};

NewProjectModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default NewProjectModal;
