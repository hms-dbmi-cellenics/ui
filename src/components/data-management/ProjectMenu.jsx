import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import hash from 'object-hash';
import { useSelector, useDispatch } from 'react-redux';
import {
  Row, Typography, Space, Button, Col, Tooltip,
} from 'antd';
import pipelineStatus from '../../utils/pipelineStatusValues';
import { DEFAULT_NA } from '../../redux/reducers/projects/initialState';
import {
  updateProject,
} from '../../redux/actions/projects'; import DownloadData from './DownloadData';
import fileUploadSpecifications from '../../utils/upload/fileUploadSpecifications';
import UploadStatus from '../../utils/upload/UploadStatus';

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
  const [willGem2sRerun, setWillGem2sRerun] = useState({ rerun: true, reasons: [] });
  const backendStatus = useSelector((state) => state.backendStatus);
  const initialProjectState = useRef({});

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
      return Object.values(sample.metadata).every((value) => value.length > 0 && value !== DEFAULT_NA);
    };

    const canLaunch = activeProject?.samples?.every((sampleUuid) => {
      const checkedSample = samples[sampleUuid];
      return allSampleFilesUploaded(checkedSample)
        && allSampleMetadataInserted(checkedSample);
    });
    return canLaunch;
  };

  const getProjectHash = (project) => {
    const samplesToHash = project.samples.map((sampleUuid) => ({
      name: samples[sampleUuid].name,
      metadata: samples[sampleUuid].metadata,
    }));

    return hash.MD5(samplesToHash);
  };

  // Initialize hash for each project
  useEffect(() => {
    if (!activeProjectUuid) return;

    if (!initialProjectState.current[activeProjectUuid]) {
      initialProjectState.current[activeProjectUuid] = getProjectHash(activeProject);
    }

    const reasons = [];

    const experimentId = activeProject.experiments[0];
    const gem2sStatus = backendStatus[experimentId]?.status.gem2s?.status;

    const gem2sNotSuccessful = ![pipelineStatus.SUCCEEDED, pipelineStatus.RUNNING].includes(gem2sStatus);
    const ProjectHashNotEqual = initialProjectState.current[activeProjectUuid] !== getProjectHash(activeProject);

    if (gem2sNotSuccessful) reasons.push('data has not been processed sucessfully');
    if (ProjectHashNotEqual) reasons.push('the project has been modified');

    setWillGem2sRerun({
      rerun: gem2sNotSuccessful || ProjectHashNotEqual,
      reasons,
    });
  }, [backendStatus, activeProjectUuid, samples]);

  const reingestIndicator = (rerun) => (
    <div style={{
      width: '0.75rem',
      height: '0.75rem',
      marginLeft: '0.6rem',
      display: 'inline-block',
      borderRadius: '50%',
      verticalAlign: 'middle',
      backgroundColor: rerun ? 'tomato' : 'lightgreen',
    }}
    />
  );

  const launchTooltipMessage = () => {
    if (activeProject?.samples.length > 0 && !canLaunchAnalysis()) {
      return `Ensure all samples are uploaded and all metadata are inserted (no ${DEFAULT_NA})`;
    }

    if (willGem2sRerun.rerun) {
      return `The data for this has to be processed because ${willGem2sRerun.reasons.join(' and ')}.This might take a while.`;
    }
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
          <Tooltip
            title={launchTooltipMessage()}
          >
            <Button
              data-test-id='launch-analysis-button'
              type='primary'
              disabled={!canLaunchAnalysis()}
              onClick={() => openAnalysisModal()}
            >
              Launch analysis
              {reingestIndicator(willGem2sRerun.rerun)}
            </Button>
          </Tooltip>
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
