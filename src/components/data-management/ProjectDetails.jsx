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
import SamplesTable from './SamplesTable';
import ProjectMenu from './ProjectMenu';

const {
  Title, Text, Paragraph, Link,
} = Typography;

const ProjectDetails = ({ width, height }) => {
  const dispatch = useDispatch();

  const { activeProjectUuid } = useSelector((state) => state.projects.meta);
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);

  const samplesTableRef = useRef();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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
          <span>
            <Text strong>
              Description:
            </Text>
            {activeProject.description.length > 0 ? (
              <>
                <Link onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                  {isDescriptionExpanded ? ' Collapse' : ' Expand'}
                </Link>
              </>
            ) : <></>}
          </span>
          <Paragraph
            editable={{
              onChange: (description) => dispatch(
                updateProject(activeProjectUuid, { description }),
              ),
            }}
            ellipsis={!isDescriptionExpanded ? { rows: 1 } : false}
          >
            {activeProject.description}
          </Paragraph>
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
