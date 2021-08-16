import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Modal, Button, Input, Space, Typography, Form, Alert,
} from 'antd';

const { Text, Paragraph } = Typography;

const ProjectDeleteModal = (props) => {
  const {
    visible, onDelete, onCancel, projectName,
  } = props;

  const [inputProjectName, setInputProjectName] = useState('');
  const [isValid, setIsValid] = useState(false);

  return (
    <Modal
      className='delete-project-modal'
      title='Confirm delete'
      visible={visible}
      footer={(
        <Space>
          <Button
            type='secondary'
            key='cancel'
            onClick={() => {
              onCancel(inputProjectName);
              setInputProjectName('');
              setIsValid(false);
            }}
          >
            Keep project
          </Button>

          <Button
            type='danger'
            key='create'
            disabled={!isValid}
            onClick={() => {
              onDelete();
              setInputProjectName('');
              setIsValid(false);
            }}
          >
            Permanently delete project
          </Button>
        </Space>
      )}
      onCancel={onCancel}
    >
      <Space>
        <Space direction='vertical'>
          <Paragraph>
            Are you
            {' '}
            <Text strong>absolutely</Text>
            {' '}
            sure?
          </Paragraph>
          <Paragraph>
            {' '}
            This will delete the project
            {' '}
            <Text strong>{projectName}</Text>
            {', '}
            all of its data sets, metadata,
            analyses, and all other information
            under this project.
          </Paragraph>

          <Paragraph>
            <Alert
              message='This action cannot be undone. Make sure you understand its effects before continuing.'
              type='warning'
              showIcon
            />
          </Paragraph>

          <Form layout='vertical'>
            <Form.Item
              label='Type in the name of the project to confirm:'
            >
              <Input
                onChange={(e) => {
                  setIsValid(projectName === e.target.value);
                  setInputProjectName(e.target.value);
                }}
                placeholder={projectName}
                value={inputProjectName}
              />
            </Form.Item>
          </Form>

        </Space>
      </Space>
    </Modal>

  );
};

ProjectDeleteModal.propTypes = {
  visible: PropTypes.bool,
  onDelete: PropTypes.func,
  onCancel: PropTypes.func,
  projectName: PropTypes.string,
};

ProjectDeleteModal.defaultProps = {
  onDelete: () => null,
  onCancel: () => null,
  visible: false,
  projectName: null,
};

export default ProjectDeleteModal;
