import React, { useEffect } from 'react';
import { Switch, Typography, Space } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { updateExperiment, loadExperiments } from 'redux/actions/experiments';
import PropTypes from 'prop-types';
import { loadProjects } from 'redux/actions/projects';

const { Text } = Typography;
const NotifyByEmail = (props) => {
  const { experimentId } = props;
  const experiment = useSelector((state) => state.experiments[experimentId]) || [];
  const dispatch = useDispatch();
  const changeEmailNotification = (value) => {
    dispatch(updateExperiment(experimentId, { notifyByEmail: value }));
  };
  const experiments = useSelector((state) => state.experiments);
  const { activeProjectUuid } = useSelector((state) => state.projects.meta);
  useEffect(() => {
    if (!activeProjectUuid) {
      dispatch(loadProjects());
    }
  }, []);

  useEffect(() => {
    if (!experiments.ids?.length && activeProjectUuid) {
      dispatch(loadExperiments(activeProjectUuid));
    }
  }, [activeProjectUuid]);

  return (
    <Space direction='horizontal'>
      <Text>Get notified about your pipeline status via email  </Text>
      <Switch
        checked={experiment?.notifyByEmail}
        onChange={(value) => changeEmailNotification(value)}
      />
    </Space>
  );
};

NotifyByEmail.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default NotifyByEmail;
