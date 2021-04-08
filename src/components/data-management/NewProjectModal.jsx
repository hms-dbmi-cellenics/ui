import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Modal, Button, Input, Space, Typography, Form,
} from 'antd';

import validateProjectName from '../../utils/validateProjectName';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const NewProjectModal = (props) => {
  const {
    visible,
    onCreate,
    onCancel,
    firstTimeFlow,
    projects,
  } = props;

  const [projectNames, setProjectNames] = useState(new Set());

  useEffect(() => {
    setProjectNames(new Set(projects.ids.map((id) => projects[id].name.trim())));
  }, [projects.ids]);

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isValid, setIsValid] = useState(false);

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
            onCreate(projectName, projectDescription);
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
              validateStatus={validateProjectName(projectName, projectNames) !== true && 'error'}
              help={validateProjectName(projectName, projectNames)}
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
                  setIsValid(validateProjectName(e.target.value, projectNames) === true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValid) {
                    onCreate(projectName, projectDescription);
                    setProjectName('');
                    setIsValid(false);
                  }
                }}
                placeholder='Ex.: Lung gamma delta T cells'
                value={projectName}
              />
            </Form.Item>
            <Form.Item
              label='Project description'
            >
              <TextArea
                onChange={(e) => { setProjectDescription(e.target.value); }}
                placeholder='Type description'
                autoSize={{ minRows: 3, maxRows: 5 }}
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
  projects: PropTypes.object,
};

NewProjectModal.defaultProps = {
  visible: true,
  onCreate: () => null,
  onCancel: () => null,
  firstTimeFlow: false,
  projects: { ids: [] },
};

export default NewProjectModal;
