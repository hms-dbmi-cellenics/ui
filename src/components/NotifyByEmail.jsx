import React, { useEffect } from 'react';
import { Switch, Typography, Space } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { updateExperiment, loadExperiments } from 'redux/actions/experiments';
import PropTypes from 'prop-types';

const { Text } = Typography;
const NotifyByEmail = (props) => {
  const { experimentId } = props;
  const experiment = useSelector((state) => state.experiments[experimentId]) || false;
  const dispatch = useDispatch();
  const changeEmailNotification = (value) => {
    dispatch(updateExperiment(experimentId, { notifyByEmail: value }));
  };
  const { activeExperimentId } = useSelector((state) => state?.experiments?.meta) || false;

  useEffect(() => {
    if (!activeExperimentId) {
      dispatch(loadExperiments());
    }
  }, []);

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
