import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Modal, Button, Input, Space, Typography,
} from 'antd';

const { Text, Title } = Typography;

const NewProjectModal = (props) => {
  const { visible, onCreate, onCancel } = props;

  const [projectName, setProjectName] = useState('');
  const [isValid, setIsValid] = useState(false);

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
          disabled={!isValid}
          onClick={() => {
            onCreate(projectName);
            setProjectName('');
            setIsValid(false);
          }}
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
          <br />
          <Input
            onChange={(e) => {
              setProjectName(e.target.value);
              setIsValid(validateProjectName(e.target.value));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onCreate(projectName);
                setProjectName('');
                setIsValid(false);
              }
            }}
            value={projectName}
          />

          {projectName.length < 8 ? <Text type='secondary'>Your project name must be at least 8 characters.</Text> : <></>}
          {projectName.length >= 8 && !isValid ? <Text type='danger'>Your project name can only contain letters, numbers, space, _, and -.</Text> : <></>}

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
