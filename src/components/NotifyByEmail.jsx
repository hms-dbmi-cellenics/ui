import React from 'react';
import { Switch, Typography, Space } from 'antd';
import { Auth } from 'aws-amplify';
import { useDispatch, useSelector } from 'react-redux';
import { updateExperiment } from 'redux/actions/experiments';
import PropTypes from 'prop-types';

const { Text } = Typography;
const NotifyByEmail = (props) => {
  const { experimentId } = props;
  const experiment = useSelector((state) => state.experiments[experimentId]);
  const dispatch = useDispatch();
  const changeEmailNotification = (value) => {
    if (value) {
      Auth.currentAuthenticatedUser()
        .then((userData) => {
          const { email } = userData.attributes;
          dispatch(updateExperiment(experimentId, { notifyByEmail: [email] }));
        })
        .catch((e) => console.log('error during getuser', e));
    } else {
      dispatch(updateExperiment(experimentId, { notifyByEmail: [] }));
    }
  };
  return (
    <Space direction='horizontal'>
      <Text>Get notified about your pipeline status via email  </Text>
      <Switch
        checked={experiment?.notifyByEmail?.length}
        onChange={(value) => changeEmailNotification(value)}
      />
    </Space>
  );
};

NotifyByEmail.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default NotifyByEmail;
