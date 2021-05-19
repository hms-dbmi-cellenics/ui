import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
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
import validateInputs, { rules } from '../../utils/validateInputs';

const { Title } = Typography;

const NewExperimentModal = (props) => {
  const {
    visible,
    onLaunch,
    onCancel,
    activeProject,
    experiments,
  } = props;

  const dispatch = useDispatch();

  const [experimentsList, setExperimentsList] = useState([]);
  const [numFieldsEditing, setNumFieldsEditing] = useState(0);

  useEffect(() => {
    setExperimentsList(
      activeProject?.experiments?.map((experimentId) => experiments[experimentId]),
    );
  }, [activeProject, experiments]);

  const validationChecks = [
    rules.MIN_1_CHAR,
    rules.ALPHANUM_DASH_SPACE,
  ];

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
            <List
              size='small'
              bordered
              dataSource={experimentsList}
              itemLayout='vertical'
              renderItem={(experiment) => (
                <List.Item
                  key={`${experiment.name}`}
                  extra={(
                    <Row type='flex' align='middle'>
                      <Col>
                        <Button
                          type='primary'
                          onClick={() => onLaunch(experiment.id)}
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
                        onAfterSubmit={(name) => {
                          dispatch(updateExperiment(experiment.id, { name: name.trim() }));
                          setNumFieldsEditing(numFieldsEditing - 1);
                        }}
                        onAfterCancel={() => setNumFieldsEditing(numFieldsEditing - 1)}
                        value={experiment.name}
                        validationFunc={(name) => validateInputs(name, validationChecks).isValid}
                        deleteEnabled={false}
                        onEditing={(editing) => { if (editing) setNumFieldsEditing(numFieldsEditing + 1); }}
                      />
                    </strong>
                    <EditableField
                      onAfterSubmit={(name) => {
                        dispatch(updateExperiment(experiment.id, { name: name.trim() }));
                        setNumFieldsEditing(numFieldsEditing - 1);
                      }}
                      onAfterCancel={() => setNumFieldsEditing(numFieldsEditing - 1)}
                      value={experiment.description}
                      deleteEnabled={false}
                      onEditing={(editing) => { if (editing) setNumFieldsEditing(numFieldsEditing + 1); }}
                    />
                  </Space>
                </List.Item>
              )}
            />
          </Space>
        </Col>
      </Row>
    </Modal>

  );
};

NewExperimentModal.propTypes = {
  visible: PropTypes.bool,
  onCancel: PropTypes.func,
  onLaunch: PropTypes.func,
  activeProject: PropTypes.object.isRequired,
  experiments: PropTypes.object.isRequired,
};

NewExperimentModal.defaultProps = {
  visible: true,
  onCancel: null,
  onLaunch: null,
};

export default NewExperimentModal;
