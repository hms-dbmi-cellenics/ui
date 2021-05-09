import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import mime from 'mime-types';
import path from 'path';

import {
  Modal,
  Button,
  Typography,
  Select,
  Space,
  Row,
  Col,
  List,
} from 'antd';
import TextArea from 'antd/lib/input/TextArea';

const { Text, Title } = Typography;
const { Option } = Select;

const NewExperimentModal = (props) => {
  const {
    visible, onChange, onLaunch, onCancel, activeProject,
  } = props;
  const [name, setName] = useState('Experiment Name');
  const [description, setDescription] = useState('Description');
  const [validExperimentName, setValidExperimentName] = useState(false);
  const [experiments, setExperiments] = useState([]);

  useEffect(() => {
    const longerThanZero = name.length === 0;
    const OnlyAlphaNumDashUnderscoreSpace = name.match(/[^\w\s+_-]/gm) === null;

    setValidExperimentName(
      longerThanZero
      && OnlyAlphaNumDashUnderscoreSpace,
    );
  }, [name]);

  // change this when we support multiple experiments
  const experimentDetails = {
    [activeProject.experiments[0]]: {
      experimentId: experiments[0],
      name,
      description,
    },
  };

  useEffect(() => {
    if (activeProject.experiments.length === 0) return;

    setExperiments(activeProject.experiments.map((experimentId) => ({
      ...experimentDetails[experimentId],
    })));
  }, [activeProject]);

  const data = [
    {
      experimentId: '12345',
      name: 'Test',
      description: 'Lorem ipsum sip dolor amet',
    },
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
              dataSource={data}
              itemLayout='vertical'
              renderItem={(item) => (
                <List.Item
                  key={`${item.name}`}
                  extra={(
                    <Row type='flex' align='middle'>
                      <Col>
                        <Button
                          type='primary'
                          onClick={() => onLaunch(item.experimentId)}
                        >
                          Launch
                        </Button>
                      </Col>
                    </Row>
                  )}
                >
                  <Space direction='vertical' size='small'>
                    <Text><strong level={6}>{item.name}</strong></Text>
                    <Text>{item.description}</Text>
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
  onChange: PropTypes.func,
  onCancel: PropTypes.func,
  onLaunch: PropTypes.func,
  activeProject: PropTypes.object,
};

NewExperimentModal.defaultProps = {
  visible: true,
  onChange: null,
  onCancel: null,
  onLaunch: null,
  activeProject: {},
};

export default NewExperimentModal;
