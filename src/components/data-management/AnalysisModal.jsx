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

  useEffect(() => {
    setExperimentsList(
      activeProject?.experiments?.map((experimentId) => experiments[experimentId]),
    );
  }, [activeProject]);

  const checkNameValidity = (name) => {
    const longerThanZero = name.trim().length > 0;
    const OnlyAlphaNumDashUnderscoreSpace = name.match(/[^\w\s+_-]/gm) === null;
    return longerThanZero && OnlyAlphaNumDashUnderscoreSpace;
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
            <List
              size='small'
              bordered
              dataSource={experimentsList}
              itemLayout='vertical'
              renderItem={(item) => (
                <List.Item
                  key={`${item.name}`}
                  extra={(
                    <Row type='flex' align='middle'>
                      <Col>
                        <Button
                          type='primary'
                          onClick={() => onLaunch(item.id)}
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
                        onAfterSubmit={(name) => dispatch(
                          updateExperiment(item.id, { name: name.trim() }),
                        )}
                        value={item.name}
                        validationFunc={(name) => checkNameValidity(name)}
                        deleteEnabled={false}
                      />
                    </strong>
                    <EditableField
                      onAfterSubmit={(description) => dispatch(
                        updateExperiment(item.id, { description: description.trim() }),
                      )}
                      value={item.description}
                      deleteEnabled={false}
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
