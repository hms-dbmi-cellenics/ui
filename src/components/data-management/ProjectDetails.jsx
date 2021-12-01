/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useRef, useState, useMemo } from 'react';
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
  const { PANEL_HEADING_HEIGHT, PANEL_PADDING } = layout;

  const availableWidth = width - PANEL_PADDING * 2; // * 2 because left and right
  const availableHeight = height - PANEL_HEADING_HEIGHT - PANEL_PADDING * 2; // * 2 because top and bottom

  const dispatch = useDispatch();

  const { activeProjectUuid } = useSelector((state) => state.projects.meta);
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);

  const samplesTableRef = useRef();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const getProjectContentHeight = (container, usableHeight) => {
    if (!container) return 0;

    const antSpaceContainer = container.children[0];

    // Get elements whose heights we want to compute
    const antItems = Array.from(antSpaceContainer.children);
    antItems.pop();

    // Gaps exist between space item elemets and have to be included in the calculation
    const GAP_HEIGHT = 8;

    const totalItemsHeight = antItems.reduce((totalHeight, elem) => totalHeight + elem.offsetHeight + GAP_HEIGHT, 0);

    return usableHeight - totalItemsHeight;
  };

  const projectDetailsDiv = document.getElementById('project-details');
  const MAX_CONTENT_HEIGHT = useMemo(() => getProjectContentHeight(projectDetailsDiv, availableHeight), [!projectDetailsDiv, availableHeight]);

  return (
    <div
      id='project-details'
      width={width}
      height={height}
      style={{
        padding: layout.PANEL_PADDING,
      }}
    >
      <Space direction='vertical' style={{ width: availableWidth }}>
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
        <div>
          <Text type='secondary'>
            {`Project ID: ${activeProjectUuid}`}
            {' - '}
            {`Experiment ID: ${activeProject.experiments[0]}`}
          </Text>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: MAX_CONTENT_HEIGHT }}>
          <Space direction='vertical' size='small' style={{ width: availableWidth - 16 }}>
            <span>
              <Text strong>
                Description:
              </Text>
              {activeProject.description.length > 0 ? (
                <>
                  <Link onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                    { isDescriptionExpanded ? ' Collapse' : ' Expand' }
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
          </Space>
        </div>
      </Space>
    </div>
  );
};

ProjectDetails.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default ProjectDetails;
