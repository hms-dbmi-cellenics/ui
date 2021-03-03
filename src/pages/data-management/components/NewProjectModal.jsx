import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Modal, Button, Input, Space, Typography,
} from 'antd';

const { Text, Title } = Typography;

const NewProjectModal = (props) => {
  const { visible, onCreate, onCancel } = props;

  const [projectName, setProjectName] = useState('');
  const [isInvalid, setIsInvalid] = useState(true);

  const validateProjectName = (input) => input.length >= 8
    && input.match(/([a-zA-Z\d]{2,}){1,}/gm)
    && input.match(/^[a-zA-Z\s\d-_]{8,}$/gm);

  return (
    <Modal
      title=''
      visible={visible}
      footer={(
        <Button
          type='primary'
          key='create'
          block
          disabled={isInvalid}
          onClick={() => { onCreate(projectName); }}
        >
          Create Project
        </Button>
      )}
      style={{ textAlign: 'center' }}
      onCancel={onCancel}
    >
      <Space align='center'>
        <Space direction='vertical' style={{ marginTop: '2rem' }}>
          <Title level={3}>
            Create a project to start analyzing
            <br />
            your data in Cellscope
          </Title>
          <Text type='secondary'>
            Project name can only contain alphabets (a-z, A-Z), space ( ), numbers (0-9), underscore (_) and dash (-) with a minimum of 8 characters
          </Text>
          <br />
          <Input
            onChange={(e) => {
              setProjectName(e.target.value);
              setIsInvalid(!validateProjectName(e.target.value));
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') onCreate(projectName); }}
            value={projectName}
          />
          <Text type='danger'>
            {projectName.length >= 8 && isInvalid ? 'Invalid project name' : <br />}
          </Text>
        </Space>
      </Space>
    </Modal>

  );
};

NewProjectModal.propTypes = {
  visible: PropTypes.bool,
  onCreate: PropTypes.func,
  onCancel: PropTypes.func,
};

NewProjectModal.defaultProps = {
  visible: true,
  onCreate: null,
  onCancel: null,
};

export default NewProjectModal;
