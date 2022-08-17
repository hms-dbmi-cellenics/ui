import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Modal } from 'antd';
import Text from 'antd/lib/typography/Text';
import { runQC } from 'redux/actions/pipeline';
import { useDispatch, useSelector } from 'react-redux';

import { discardChangedQCFilters } from 'redux/actions/experimentSettings';
import { cloneExperiment, loadExperiments } from 'redux/actions/experiments';

import { useAppRouter } from 'utils/AppRouteProvider';
import { modules } from 'utils/constants';

const QCRerunDisabledModal = (props) => {
  const { experimentId, onCancel, onRunQC } = props;

  const dispatch = useDispatch();
  const { navigateTo } = useAppRouter();

  const experimentName = useSelector((state) => state.experimentSettings.info.experimentName);

  const triggerOnRunQC = () => {
    dispatch(runQC(experimentId));
    onRunQC();
  };

  const cloneExperimentAndSelectIt = async () => {
    dispatch(discardChangedQCFilters());
    const newExperimentId = await dispatch(cloneExperiment(experimentId, `Clone of ${experimentName}`));
    await dispatch(loadExperiments());

    navigateTo(modules.DATA_MANAGEMENT, { experimentId: newExperimentId }, true);
  };

  return (
    <Modal
      title='Run data processing with the changed settings'
      visible
      onCancel={() => onCancel()}
      footer={
        [
          <Button type='primary' onClick={() => triggerOnRunQC()}>Start</Button>,
          <Button type='primary' onClick={() => cloneExperimentAndSelectIt()}>Clone Project</Button>,
          <Button onClick={() => onCancel()}>Cancel</Button>,
        ]
      }
    >
      <Alert
        type='warning'
        description={(
          <>
            <p>
              Due to a recent update, re-running the pipeline
              will initiate the run from the beginning
              and you will lose all of your annotated cell sets. You have 3 options:
            </p>
            <ul>
              <li>
                Click
                <Text code>Start</Text>
                {' '}
                to re-run this project analysis from the beginning. Note that you will
                lose all of your annotated cell sets.
              </li>
              <li>
                Click
                <Text code>Clone Project</Text>
                {' '}
                to clone this project and run from the beginning for the new project only.
                Your current project will not re-run, and will still be available to explore.
              </li>
              <li>
                Click
                <Text code>Cancel</Text>
                {' '}
                to close this popup. You can then choose to discard the changed
                settings in your current project.
              </li>
            </ul>
          </>
        )}
      />
      <p>
        This might take several minutes.
        Your navigation within Cellenics will be restricted during this time.
        Do you want to start?
      </p>
    </Modal>
  );
};

QCRerunDisabledModal.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onRunQC: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default QCRerunDisabledModal;
