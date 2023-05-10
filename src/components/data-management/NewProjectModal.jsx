import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ClipLoader } from 'react-spinners';
import PropTypes from 'prop-types';
import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Typography,
} from 'antd';

import { createExperiment } from 'redux/actions/experiments';

import validateInputs, { rules } from 'utils/validateInputs';
import integrationTestConstants from 'utils/integrationTestConstants';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const NewProjectModal = (props) => {
  const {
    onCreate,
    onCancel,
  } = props;

  const experiments = useSelector(((state) => state.experiments));
  const { saving, error } = experiments.meta;

  const dispatch = useDispatch();
  const [projectNames, setProjectNames] = useState(new Set());
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isValidName, setIsValidName] = useState(false);

  const firstTimeFlow = experiments.ids.length === 0;
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
    setProjectNames(new Set(experiments.ids.map((id) => experiments[id].name.trim())));
  }, [experiments.ids]);

  useEffect(() => {
    setIsValidName(validateInputs(projectName, validationChecks, validationParams).isValid);
  }, [projectName, projectNames]);

  const submit = () => {
    setProjectName('');

    dispatch(createExperiment(projectName, projectDescription));
    onCreate(projectName, projectDescription);
  };

  return (
    <Modal
      className={integrationTestConstants.classes.NEW_PROJECT_MODAL}
      title='Create a new project'
      visible
      footer={(
        <Button
          data-test-id={integrationTestConstants.ids.CONFIRM_CREATE_NEW_PROJECT}
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
              your data in Cellenics
            </Title>
          )}
          <Paragraph>
            Projects are where you can organize your data into
            samples, assign metadata, and start your analysis
            in Cellenics. Name it after the experiment
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
                data-test-id={integrationTestConstants.ids.PROJECT_NAME}
                aria-label='new project name'
                onChange={(e) => {
                  setProjectName(e.target.value.trim());
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValidName) {
                    submit();
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
                data-test-id={integrationTestConstants.ids.PROJECT_DESCRIPTION}
                onChange={(e) => { setProjectDescription(e.target.value); }}
                placeholder='Type description'
                autoSize={{ minRows: 3, maxRows: 5 }}
                disabled={saving}
                aria-label='new project description'
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
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default NewProjectModal;
