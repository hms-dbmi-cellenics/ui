import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Modal, Button, Input, Space, Typography, Form,
} from 'antd';
import { ClipLoader } from 'react-spinners';
import validateInputs, { rules } from '../../utils/validateInputs';

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
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setProjectNames(new Set(projects.ids.map((id) => projects[id].name.trim())));
  }, [projects.ids]);

  const {
    saving,
    error,
  } = useSelector((state) => state.projects.meta);

  const validationChecks = [
    rules.MIN_8_CHARS,
    rules.MIN_2_SEQUENTIAL_CHARS,
    rules.ALPHANUM_DASH_SPACE,
    rules.UNIQUE_NAME,
  ];

  const validationParams = {
    existingNames: projectNames,
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
              validateStatus={validateInputs(
                projectName,
                validationChecks,
                validationParams,
              )[0] ? 'success' : 'error'}
              help={validateInputs(
                projectName,
                validationChecks,
                validationParams,
                (errMsg) => (
                  <ul>
                    {errMsg.filter((msg) => msg !== true).map((msg) => <li>{msg}</li>)}
                  </ul>
                ),
              )}
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
                  const [valid] = validateInputs(
                    projectName,
                    validationChecks,
                    validationParams,
                  );
                  setIsValid(valid);
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
                disabled={saving}
              />
            </Form.Item>
            <Form.Item
              label='Project description'
            >
              <TextArea
                onChange={(e) => { setProjectDescription(e.target.value); }}
                placeholder='Type description'
                autoSize={{ minRows: 3, maxRows: 5 }}
                disabled={saving}
              />
            </Form.Item>
          </Form>

          {
            saving && (
              <center>
                <Space direction='vertical'>
                  <ClipLoader
                    size={50}
                    color='#8f0b10'
                  />
                  <Text>Creating project...</Text>
                </Space>
              </center>
            )
          }

          {
            error && (
              <Text type='danger' style={{ fontSize: 14 }}>
                {error}
              </Text>
            )
          }

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
