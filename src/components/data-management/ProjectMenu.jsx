import React from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Row, Typography, Space, Button, Col,
} from 'antd';
import {
  updateProject,
} from '../../redux/actions/projects'; import DownloadData from './DownloadData';
import fileUploadSpecifications from '../../utils/upload/fileUploadSpecifications';
import UploadStatus from '../../utils/upload/UploadStatus';
import integrationTestConstants from '../../utils/integrationTestConstants';

const { Title, Text, Paragraph } = Typography;

const ProjectMenu = (props) => {
  const {
    activeProjectUuid, createMetadataColumn, isAddingMetadata,
    setUploadModalVisible, openAnalysisModal,
  } = props;
  const dispatch = useDispatch();
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);
  const projects = useSelector((state) => state.projects);
  const samples = useSelector((state) => state.samples);
  const anyProjectsAvailable = projects?.ids?.length;
  const metadataKeysAvailable = activeProject?.metadataKeys?.length;

  const canLaunchAnalysis = () => {
    if (activeProject?.samples?.length === 0 || !anyProjectsAvailable) return false;

    const allSampleFilesUploaded = (sample) => {
      // Check if all files for a given tech has been uploaded
      const fileNamesArray = Array.from(sample.fileNames);
      if (
        fileUploadSpecifications[sample.type].requiredFiles.every(
          (file) => !fileNamesArray.includes(file),
        )
      ) { return false; }
      return fileNamesArray.every((fileName) => {
        const checkedFile = sample.files[fileName];
        return checkedFile.valid && checkedFile.upload.status === UploadStatus.UPLOADED;
      });
    };

    const allSampleMetadataInserted = (sample) => {
      if (!metadataKeysAvailable) return true;
      if (Object.keys(sample.metadata).length !== metadataKeysAvailable) return false;
      return Object.values(sample.metadata).every((value) => value && value.length > 0);
    };

    const canLaunch = activeProject?.samples?.every((sampleUuid) => {
      const checkedSample = samples[sampleUuid];
      return allSampleFilesUploaded(checkedSample)
        && allSampleMetadataInserted(checkedSample);
    });
    return canLaunch;
  };
  return (
    <>
      <Row style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Title level={3}>{activeProject?.name}</Title>
        <Space>
          <Button
            data-test-id={integrationTestConstants.ids.ADD_SAMPLES_BUTTON}
            disabled={!anyProjectsAvailable}
            onClick={() => setUploadModalVisible(true)}
          >
            Add samples
          </Button>
          <Button
            disabled={
              !anyProjectsAvailable
              || activeProject?.samples?.length === 0
              || isAddingMetadata
            }
            onClick={() => {
              createMetadataColumn();
            }}
          >
            Add metadata
          </Button>
          <DownloadData
            activeProjectUuid={activeProjectUuid}
          />
          <Button
            data-test-id={integrationTestConstants.ids.LAUNCH_ANALYSIS_BUTTON}
            type='primary'
            disabled={!canLaunchAnalysis()}
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
                  editable={{
                    onChange: (description) => dispatch(
                      updateProject(activeProjectUuid, { description }),
                    ),
                  }}
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
ProjectMenu.propTypes = {
  activeProjectUuid: PropTypes.string.isRequired,
  createMetadataColumn: PropTypes.func.isRequired,
  isAddingMetadata: PropTypes.bool.isRequired,
  setUploadModalVisible: PropTypes.func.isRequired,
  openAnalysisModal: PropTypes.func.isRequired,
};
export default ProjectMenu;
