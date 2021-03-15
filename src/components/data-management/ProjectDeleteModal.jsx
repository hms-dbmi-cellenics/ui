import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Modal, Button, Input, Space, Typography, Form, Alert,
} from 'antd';

const { Text, Paragraph, Title } = Typography;

const ProjectDeleteModal = (props) => {
  const {
    visible, onDelete, onCancel,
  } = props;

  const [inputProjectName, setInputProjectName] = useState('');
  const [isValid, setIsValid] = useState(false);

  return (
    <Modal
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
            Cancel
          </Button>

          <Button
            type='danger'
            key='create'
            // disabled={!isValid}
            onClick={() => {
              onDelete(inputProjectName);
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
            <Text strong>
              Sample project
            </Text>
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
                  setInputProjectName(e.target.value);
                }}
                placeholder='Ex.: Lung gamma delta T cells'
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
};

ProjectDeleteModal.defaultProps = {
  onDelete: () => null,
  onCancel: () => null,
  visible: false,
};

export default ProjectDeleteModal;
