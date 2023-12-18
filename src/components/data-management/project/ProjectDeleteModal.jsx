import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  Modal, Button, Input, Space, Typography, Form, Alert,
} from 'antd';
import { deleteExperiment } from 'redux/actions/experiments';
import integrationTestConstants from 'utils/integrationTestConstants';

const { Text, Paragraph } = Typography;

const ProjectDeleteModal = (props) => {
  const {
    experimentId, onCancel, onDelete,
  } = props;

  const dispatch = useDispatch();
  const experimentName = useSelector((state) => state.experiments[experimentId].name);

  const [inputExperimentName, setInputExperimentName] = useState('');
  const [isValid, setIsValid] = useState(false);
  return (
    <Modal
      className={integrationTestConstants.classes.DELETE_PROJECT_MODAL}
      title='Confirm delete'
      open
      footer={(
        <Space>
          <Button
            type='secondary'
            key='cancel'
            onClick={() => {
              onCancel();
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
              dispatch(deleteExperiment(experimentId));
              onDelete();
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
            <Text strong>{experimentName}</Text>
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
                data-test-id={integrationTestConstants.classes.DELETE_PROJECT_MODAL_INPUT}
                onChange={(e) => {
                  setIsValid(experimentName === e.target.value);
                  setInputExperimentName(e.target.value);
                }}
                placeholder={experimentName}
                value={inputExperimentName}
              />
            </Form.Item>
          </Form>

        </Space>
      </Space>
    </Modal>

  );
};

ProjectDeleteModal.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onDelete: PropTypes.func,
};

ProjectDeleteModal.defaultProps = {
  onCancel: () => null,
  onDelete: () => null,
};

export default ProjectDeleteModal;
