import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Modal, Button, Input, Space, Typography, Form,
} from 'antd';
import { ClipLoader } from 'react-spinners';
import validateInputs, { rules } from '../../utils/validateInputs';
import integrationTestIds from '../../utils/integrationTestIds';

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
  const [isValidName, setIsValidName] = useState(false);

  const validationChecks = [
    rules.MIN_8_CHARS,
    rules.MIN_2_SEQUENTIAL_CHARS,
    rules.ALPHANUM_DASH_SPACE,
    rules.UNIQUE_NAME_CASE_INSENSITIVE,
  ];

  const validationParams = {
    existingNames: projectNames,
  };

  useEffect(() => {
    setProjectNames(new Set(projects.ids.map((id) => projects[id].name.trim())));
  }, [projects.ids]);
  useEffect(() => {
    setIsValidName(validateInputs(projectName, validationChecks, validationParams).isValid);
  }, [projectName, projectNames]);

  const {
    saving,
    error,
  } = useSelector((state) => state.projects.meta);

  const submit = () => {
    const newProject = projectName;
    setProjectName('');
    onCreate(newProject, projectDescription);
  };

  return (
    <Modal
      className={integrationTestIds.class.NEW_PROJECT_MODAL}
      title='Create a new project'
      visible={visible}
      footer={(
        <Button
          data-test-id={integrationTestIds.id.CONFIRM_CREATE_NEW_PROJECT}
          type='primary'
          key='create'
          block
          disabled={!isValidName}
          onClick={() => {
            submit();
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
              validateStatus={isValidName ? 'success' : 'error'}
              help={(
                <ul>
                  {validateInputs(
                    projectName,
                    validationChecks,
                    validationParams,
                  ).results
                    .filter((msg) => msg !== true)
                    .map((msg) => <li>{msg}</li>)}
                </ul>
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
                data-test-id={integrationTestIds.id.PROJECT_NAME}
                onChange={(e) => {
                  setProjectName(e.target.value.trim());
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValidName) {
                    onCreate(projectName, projectDescription);
                    setProjectName('');
                    setIsValidName(false);
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
                data-test-id={integrationTestIds.id.PROJECT_DESCRIPTION}
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
