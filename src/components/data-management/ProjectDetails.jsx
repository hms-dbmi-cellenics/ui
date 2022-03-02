/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  Space, Typography, Button,
} from 'antd';

import PropTypes from 'prop-types';
import {
  updateProject,
} from 'redux/actions/projects';
import { layout } from 'utils/constants';
import EditableParagraph from 'components/EditableParagraph';
import SamplesTable from './SamplesTable';
import ProjectMenu from './ProjectMenu';
import ShareExperimentModal from './ShareExperimentModal';

const {
  Title, Text,
} = Typography;

const ProjectDetails = ({ width, height }) => {
  const dispatch = useDispatch();

  const { activeProjectUuid } = useSelector((state) => state.projects.meta);
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);
  const [shareExperimentModalVisible, setShareExperimentModalVisible] = useState(false);
  const samplesTableRef = useRef();

  return (
    <div
      id='project-details'
      style={{
        padding: layout.PANEL_PADDING,
        width,
        height: height - layout.PANEL_HEADING_HEIGHT,
      }}
    >
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
      }}
      >
        <div style={{ flex: 'none', paddingBottom: '1em' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Title level={3}>{activeProject.name}</Title>
            <Space>
              <Button onClick={() => setShareExperimentModalVisible(!shareExperimentModalVisible)}>Share</Button>
              {shareExperimentModalVisible && (
                <ShareExperimentModal
                  onCancel={() => setShareExperimentModalVisible(false)}
                  experimentId={activeProject.experiments[0]}
                />
              )}
              <Button
                disabled={activeProject.samples?.length === 0}
                onClick={() => samplesTableRef.current.createMetadataColumn()}
              >
                Add metadata
              </Button>
              <ProjectMenu />
            </Space>
          </div>
          <Text type='secondary'>
            {`Project ID: ${activeProjectUuid}`}
          </Text>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Text strong>
            Description:
          </Text>
          <EditableParagraph
            value={activeProject.description}
            onUpdate={(text) => {
              if (text !== activeProject.description) {
                dispatch(updateProject(activeProjectUuid, { description: text }));
              }
            }}
          />
          <SamplesTable
            ref={samplesTableRef}
          />
        </div>
      </div>
    </div>
  );
};

ProjectDetails.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default ProjectDetails;
