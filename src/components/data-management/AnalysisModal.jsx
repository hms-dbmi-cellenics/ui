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
import { ClipLoader } from 'react-spinners';
import moment from 'moment';
import { useRouter } from 'next/router';
import EditableField from '../EditableField';
import { updateExperiment, saveExperiment } from '../../redux/actions/experiments';
import {
  updateProject,
} from '../../redux/actions/projects';

import { runGem2s } from '../../redux/actions/pipeline';

const { Title } = Typography;

const AnalysisModal = (props) => {
  const {
    visible,
    onLaunch,
    onCancel,
  } = props;

  const dispatch = useDispatch();
  const router = useRouter();

  const experiments = useSelector((state) => state.experiments);
  const { activeProjectUuid } = useSelector((state) => state.projects.meta) || false;
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);

  const [experimentsList, setExperimentsList] = useState([]);
  const [numFieldsEditing, setNumFieldsEditing] = useState(0);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    if (!activeProject?.experiments?.length > 0) return;

    const updatedList = activeProject.experiments
      .map((experimentId) => experiments[experimentId])
      .filter((experiment) => experiment !== undefined);

    setExperimentsList(updatedList);
  }, [activeProject, experiments]);
  useEffect(() => {
    setIsWorking(!visible);
  }, [visible]);

  const onLaunchAnalysis = (experimentId) => {
    console.log('Launching this analysis');
    setIsWorking(true);
    onLaunch(experimentId);

    const analysisPath = '/experiments/[experimentId]/data-processing';
    const lastViewed = moment().toISOString();
    dispatch(updateExperiment(experimentId, { lastViewed }));
    dispatch(updateProject(activeProjectUuid, { lastAnalyzed: lastViewed }));

    dispatch(runGem2s(experimentId));
    router.push(analysisPath.replace('[experimentId]', experimentId));
  };

  const renderAnalysisList = () => {
    if (!experimentsList?.length > 0) {
      return (
        <Row justify='center'>
          <ClipLoader size={30} color='#8f0b10' />
        </Row>
      );
    }

    return (
      <List
        size='small'
        bordered
        dataSource={experimentsList}
        itemLayout='vertical'
        renderItem={(experiment) => (
          <List.Item
            key={`${experiment.id}`}
            extra={(
              <Row type='flex' align='middle' data-test-class='launch-analysis-item'>
                <Col>
                  <Button
                    type='primary'
                    onClick={() => {
                      onLaunchAnalysis(experiment.id);
                    }}
                    disabled={numFieldsEditing > 0 || isWorking}
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
                    dispatch(updateExperiment(experiment.id, { name: name.trim() }));
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
                  dispatch(saveExperiment(experiment.id));
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
  };

  return (
    <Modal
      title=''
      visible={visible}
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

AnalysisModal.propTypes = {
  visible: PropTypes.bool,
  onCancel: PropTypes.func,
  onLaunch: PropTypes.func,
};

AnalysisModal.defaultProps = {
  visible: true,
  onCancel: null,
  onLaunch: null,
};

export default AnalysisModal;
