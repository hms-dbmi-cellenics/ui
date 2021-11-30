/* eslint-disable react/jsx-props-no-spreading */
import React, { useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  Space, Col, Row, Typography, Button,
} from 'antd';
import PropTypes from 'prop-types';
import {
  updateProject,
} from 'redux/actions/projects';
import { layout } from 'utils/constants';
import SamplesTable from './SamplesTable';
import ProjectMenu from './ProjectMenu';

const { Title, Text, Paragraph } = Typography;

const ProjectDetails = ({ width, height }) => {
  // This is the settings for the height
  const MAX_DESCRIPTION_HEIGHT = 100; // px

  const { PANEL_HEADING_HEIGHT, PANEL_PADDING } = layout;

  const availableWidth = width - PANEL_PADDING * 2; // * 2 because left and right
  const availableHeight = height - PANEL_HEADING_HEIGHT - PANEL_PADDING * 2; // * 2 because top and bottom

  const dispatch = useDispatch();

  const { activeProjectUuid } = useSelector((state) => state.projects.meta);
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);

  const samplesTableRef = useRef();

  const getDetailsHeight = (availableHeight) => {
    const projectDetailsDiv = document.getElementById('project-details');

    if (!projectDetailsDiv) return 0;

    const antSpaceContainer = projectDetailsDiv.children[0];

    // Get elements whose heights we want to compute
    const antItems = Array.from(antSpaceContainer.children);
    antItems.pop();

    // Get gap to add to the calculation
    const gapHeightInPx = getComputedStyle(antSpaceContainer, null).getPropertyValue('gap');
    const GAP_HEIGHT = Number.parseInt(gapHeightInPx.replace('px', ''), 10);

    // get remaining space
    const totalItemsHeight = antItems.reduce((totalHeight, elem) => totalHeight + elem.offsetHeight + GAP_HEIGHT, 0);
    return availableHeight - totalItemsHeight;
  };

  const tableHeight = useMemo(
    () => getDetailsHeight(availableHeight),
    [availableHeight, activeProject.title, activeProject.description],
  );

  return (
    <div id='project-details' width={width} height={height}>
      <Space direction='vertical' style={{ width: '100%' }}>
        <Row>
          <Col span={24} style={{ display: 'flex', justifyContent: 'space-between' }}>
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
          </Col>
        </Row>
        <Row>
          <Col>
            <Space direction='vertical' size='small' style={{ width }}>
              <Text type='secondary'>{`ID : ${activeProjectUuid}`}</Text>
              <Text strong>Description:</Text>
              <div style={{
                overflow: 'auto',
                width: availableWidth,
                maxHeight: `${MAX_DESCRIPTION_HEIGHT}px`,
              }}
              >
                <Paragraph
                  editable={{
                    onChange: (description) => dispatch(
                      updateProject(activeProjectUuid, { description }),
                    ),
                  }}
                >
                  {activeProject.description}
                </Paragraph>
              </div>
            </Space>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <SamplesTable
              ref={samplesTableRef}
              height={tableHeight}
            />
          </Col>
        </Row>
      </Space>
    </div>
  );
};

ProjectDetails.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default ProjectDetails;
