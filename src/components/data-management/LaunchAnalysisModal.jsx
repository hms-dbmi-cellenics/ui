import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Modal,
  Button,
  Typography,
  Space,
  Row,
  Col,
  List,
} from 'antd';
import EditableField from '../EditableField';

import { updateExperiment } from '../../redux/actions/experiments';

import integrationTestConstants from '../../utils/integrationTestConstants';

const { Title } = Typography;

const LaunchAnalysisModal = (props) => {
  const {
    onLaunch,
    onCancel,
  } = props;

  const dispatch = useDispatch();

  const experiments = useSelector((state) => state.experiments);
  const { activeProjectUuid } = useSelector((state) => state.projects.meta);
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);

  const getExperimentsList = () => activeProject.experiments
    .map((experimentId) => experiments[experimentId])
    .filter((experiment) => experiment !== undefined);

  const [experimentsList, setExperimentsList] = useState(getExperimentsList());
  const [numFieldsEditing, setNumFieldsEditing] = useState(0);

  useEffect(() => {
    const updatedList = getExperimentsList();
    setExperimentsList(updatedList);
  }, [activeProject, experiments]);

  const renderAnalysisList = () => (
    <List
      size='small'
      bordered
      dataSource={experimentsList}
      itemLayout='vertical'
      renderItem={(experiment) => (
        <List.Item
          key={`${experiment.id}`}
          extra={(
            <Row type='flex' align='middle' data-test-class={integrationTestConstants.classes.LAUNCH_ANALYSIS_ITEM}>
              <Col>
                <Button
                  type='primary'
                  onClick={() => {
                    onLaunch(experiment.id);
                  }}
                  disabled={numFieldsEditing > 0}
                >
                  Launch
                </Button>
              </Col>
            </Row>
          )}
        >
          <Space direction='vertical' size='small'>
            <strong>
              <EditableField
                onAfterSubmit={async (name) => {
                  dispatch(
                    updateExperiment(experiment.id, { name: name.trim() }),
                  );
                }}
                value={experiment.name}
                deleteEnabled={false}
                onEditing={(editing) => {
                  setNumFieldsEditing(Math.max(0, numFieldsEditing + (editing || -1)));
                }}
              />
            </strong>
            <EditableField
              onAfterSubmit={(description) => {
                dispatch(
                  updateExperiment(experiment.id, { description: description.trim() }),
                );
              }}
              value={experiment.description}
              deleteEnabled={false}
              onEditing={(editing) => {
                setNumFieldsEditing(Math.max(0, numFieldsEditing + (editing || -1)));
              }}
            />
          </Space>
        </List.Item>
      )}
    />
  );

  return (
    <Modal
      title=''
      visible
      onCancel={onCancel}
      width='50%'
      footer={null}
    >
      <Row>
        <Col span={24}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Title level={4}>
              Select Analysis
            </Title>
            {renderAnalysisList()}
          </Space>
        </Col>
      </Row>
    </Modal>

  );
};

LaunchAnalysisModal.propTypes = {
  onCancel: PropTypes.func,
  onLaunch: PropTypes.func,
};

LaunchAnalysisModal.defaultProps = {
  onCancel: null,
  onLaunch: null,
};

export default LaunchAnalysisModal;
