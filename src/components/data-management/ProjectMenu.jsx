import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Row, Typography, Space, Button, Col,
} from 'antd';
import {
  updateProject,
} from '../../redux/actions/projects';
import DownloadData from './DownloadData';
import fileUploadSpecifications from '../../utils/upload/fileUploadSpecifications';
import UploadStatus from '../../utils/upload/UploadStatus';
import FileUploadModal from './FileUploadModal';
import AnalysisModal from './AnalysisModal';
import { processUpload } from '../../utils/upload/processUpload';

const { Title, Text, Paragraph } = Typography;

const ProjectMenu = (props) => {
  const {
    createMetadataColumn, isAddingMetadata,
  } = props;
  const dispatch = useDispatch();

  const { activeProjectUuid } = useSelector((state) => state.projects.meta) || false;
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);
  const projects = useSelector((state) => state.projects);
  const samples = useSelector((state) => state.samples);
  const anyProjectsAvailable = projects?.ids?.length;
  const metadataKeysAvailable = activeProject?.metadataKeys?.length;
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);

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

  const uploadFiles = (filesList, sampleType) => {
    processUpload(filesList, sampleType, samples, activeProjectUuid, dispatch);
    setUploadModalVisible(false);
  };

  return (
    <>
      <Row style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Title level={3}>{activeProject?.name}</Title>
        <Space>
          <Button
            disabled={!anyProjectsAvailable}
            onClick={() => setUploadModalVisible(true)}
          >
            Add samples
          </Button>
          {/* <Button
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
          </Button> */}
          <DownloadData />
          <Button
            data-test-id='launch-analysis-button'
            type='primary'
            disabled={!canLaunchAnalysis()}
            onClick={() => setAnalysisModalVisible(true)}
          >
            Launch analysis
          </Button>
        </Space>
      </Row>
      <FileUploadModal
        visible={uploadModalVisible}
        onUpload={uploadFiles}
        onCancel={() => setUploadModalVisible(false)}
      />
      <AnalysisModal
        visible={analysisModalVisible}
        onLaunch={() => { setAnalysisModalVisible(false); }}
        onCancel={() => { setAnalysisModalVisible(false); }}
      />
      <Row>
        {activeProjectUuid ? (
          <Col>
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
          </Col>
        ) : (<></>)}
      </Row>
    </>
  );
};
ProjectMenu.propTypes = {
  createMetadataColumn: PropTypes.func.isRequired,
  isAddingMetadata: PropTypes.bool.isRequired,
};
export default ProjectMenu;
