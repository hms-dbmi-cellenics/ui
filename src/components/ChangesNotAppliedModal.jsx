import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Modal, Typography, Space, Button,
} from 'antd';
import { useRouter } from 'next/router';
import { discardChangedQCFilters, navigateFromProcessingTo } from '../redux/actions/experimentSettings';
import { runPipeline } from '../redux/actions/pipeline';

import { getUserFriendlyQCStepName } from '../utils/qcSteps';

const { Text } = Typography;

const ChangesNotAppliedModal = (props) => {
  const { experimentId } = props;

  const router = useRouter();
  const dispatch = useDispatch();

  const {
    changedQCFilters,
    navigationPath,
  } = useSelector((state) => state.experimentSettings.processing.meta);

  return (
    <Modal
      visible={navigationPath}
      title='Changes not applied'
      onCancel={() => dispatch(navigateFromProcessingTo(''))}
      footer={(
        <Space size='large' style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            type='primary'
            key='run'
            onClick={() => {
              dispatch(runPipeline(experimentId));
              dispatch(navigateFromProcessingTo(''));
            }}
            style={{ width: '100px' }}
          >
            Run
          </Button>
          <Button
            type='primary'
            key='discard'
            onClick={() => {
              router.push(navigationPath);
              dispatch(navigateFromProcessingTo(''));
              dispatch(discardChangedQCFilters());
            }}
            style={{ width: '100px' }}
          >
            Discard
          </Button>
        </Space>
      )}
    >
      <center>
        <Space direction='vertical'>
          Your changes to the settings of these filters are not yet applied:
          {changedQCFilters.size && (
          <>
            <br />
            <ul style={{ margin: '0 auto', display: 'table' }}>
              {Array.from(changedQCFilters).map((step) => (
                <li>
                  <b style={{ float: 'left' }}>
                    {getUserFriendlyQCStepName(step)}
                  </b>
                </li>
              ))}
            </ul>

            <br />
          </>
          )}
          <Text>
            Would you like to rerun data processing with
            these new settings, or discard the changes?
          </Text>
        </Space>
      </center>
    </Modal>

  );
};

ChangesNotAppliedModal.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default ChangesNotAppliedModal;
