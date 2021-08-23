import React from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Row, Typography, Space, Button, Dropdown, Col,
} from 'antd';
import {
  updateProject,
} from '../../redux/actions/projects'; import DownloadData from './DownloadData';

const { Title, Text, Paragraph } = Typography;

const Header = (props) => {
  const {
    activeProjectUuid, createMetadataColumn, isAddingMetadata, canLaunchAnalysis,
    setUploadModalVisible, openAnalysisModal,
  } = props;
  const dispatch = useDispatch();
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]) || false;
  const projects = useSelector((state) => state.projects);
  const changeDescription = (description) => {
    dispatch(updateProject(activeProjectUuid, { description }));
  };
  return (
    <>
      <Row style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Title level={3}>{activeProject.name}</Title>
        <Space>
          <Button
            disabled={projects.ids.length === 0}
            onClick={() => setUploadModalVisible(true)}
          >
            Add samples
          </Button>
          <Button
            disabled={
              projects.ids.length === 0
            || activeProject?.samples?.length === 0
            || isAddingMetadata
            }
            onClick={() => {
              createMetadataColumn();
            }}
          >
            Add metadata
          </Button>
          <Dropdown
            overlay={() => (
              <DownloadData
                activeProjectUuid={activeProjectUuid}
              />
            )}
            trigger={['click']}
            placement='bottomRight'
            disabled={
              projects.ids.length === 0
            || activeProject?.samples?.length === 0
            }
          >
            <Button>
              Download
            </Button>
          </Dropdown>
          <Button
            type='primary'
            disabled={
              projects.ids.length === 0
            || activeProject?.samples?.length === 0
            || !canLaunchAnalysis
            }
            onClick={() => openAnalysisModal()}
          >
            Launch analysis
          </Button>
        </Space>
      </Row>
      <Row>
        <Col>
          {
            activeProjectUuid && (
              <Space direction='vertical' size='small'>
                <Text type='secondary'>{`ID : ${activeProjectUuid}`}</Text>
                <Text strong>Description:</Text>
                <Paragraph
                  editable={{ onChange: changeDescription }}
                >
                  {activeProject.description}

                </Paragraph>
              </Space>
            )
          }
        </Col>
      </Row>
    </>
  );
};
Header.propTypes = {
  activeProjectUuid: PropTypes.string.isRequired,
  createMetadataColumn: PropTypes.func.isRequired,
  isAddingMetadata: PropTypes.bool.isRequired,
  canLaunchAnalysis: PropTypes.bool.isRequired,
  setUploadModalVisible: PropTypes.func.isRequired,
  openAnalysisModal: PropTypes.func.isRequired,
};
export default Header;
