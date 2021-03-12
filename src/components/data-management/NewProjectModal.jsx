import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Modal, Button, Input, Space, Typography, Form,
} from 'antd';

const { Text, Title, Paragraph } = Typography;

const NewProjectModal = (props) => {
  const {
    visible, onCreate, onCancel, firstTimeFlow,
  } = props;

  const [projectName, setProjectName] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validateProjectName = (input) => input.length >= 8
    && input.match(/([a-zA-Z\d]{2,}){1,}/gm)
    && input.match(/^[a-zA-Z\s\d-_]{8,}$/gm);

  const renderHelpText = () => {
    if (projectName.length === 0) {
      return undefined;
    }

    if (projectName.length < 8) {
      return 'Your project name must be at least 8 characters';
    }

    if (!isValid) {
      return 'Your project name can only contain letters, numbers, space, _, and -.';
    }
  };

  return (
    <Modal
      title='Create a new project'
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
      onCancel={onCancel}
    >
      <Space>
        <Space direction='vertical' style={firstTimeFlow ? { marginTop: '2rem' } : {}}>
          {firstTimeFlow && (
            <Title level={3} style={{ textAlign: 'center' }}>
              Create a project to start analyzing
              your data in Cellscope
            </Title>
          )}
          <Paragraph>
            Projects are where you can organize your data into
            samples, assign metadata, and start your analysis
            in Cellscope. Name it after the experiment
            you&apos;re working on.
          </Paragraph>

          <Form layout='vertical'>
            <Form.Item
              validateStatus={renderHelpText() && 'error'}
              help={renderHelpText()}
              label={(
                <span>
                  Project name
                  {' '}
                  <Text type='secondary'>(You can change this later)</Text>
                </span>
              )}
              required
              name='requiredMark'
            >
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
                placeholder='Ex.: Lung gamma delta T cells'
                value={projectName}
              />
            </Form.Item>
          </Form>

        </Space>
      </Space>
    </Modal>

  );
};

NewProjectModal.propTypes = {
  visible: PropTypes.bool,
  onCreate: PropTypes.func,
  onCancel: PropTypes.func,
  firstTimeFlow: PropTypes.bool,
};

NewProjectModal.defaultProps = {
  visible: true,
  onCreate: () => null,
  onCancel: () => null,
  firstTimeFlow: false,
};

export default NewProjectModal;
