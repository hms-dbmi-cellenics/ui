/* eslint-disable react/jsx-props-no-spreading */
import React, { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  Space, Col, Row, Typography, Button,
} from 'antd';
import PropTypes from 'prop-types';
import {
  updateProject,
} from 'redux/actions/projects';
import SamplesTable from './SamplesTable';
import ProjectMenu from './ProjectMenu';

const { Title, Text, Paragraph } = Typography;

const ProjectDetails = ({ width, height }) => {
  // These constants come from CSS properties and pixel counting on screen
  const PADDING_HEIGHT = 120; // px
  const HEADER_HEIGHT = 100; // px
  const MAX_DESCRIPTION_HEIGHT = 100; // px
  const FONT_SIZE = 16; // px
  const LINE_HEIGHT = 16; // px
  const DESCRIPTION_PADDING = 2 * FONT_SIZE; // px

  const dispatch = useDispatch();

  const { activeProjectUuid } = useSelector((state) => state.projects.meta);
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);

  const samplesTableRef = useRef();

  const calculateTextHeight = (text, panelWidth) => (Math.floor((text.length * FONT_SIZE) / panelWidth) + 1) * LINE_HEIGHT;

  const descriptionHeight = (text, panelWidth) => Math.min(calculateTextHeight(text, panelWidth), MAX_DESCRIPTION_HEIGHT);

  const samplesTableHeight = (text, panelHeight, panelWidth) => panelHeight - descriptionHeight(text, panelWidth) - HEADER_HEIGHT - PADDING_HEIGHT;

  return (
    <div id='project-details' width={width} height={height}>
      <Space direction='vertical' style={{ width: '100%', padding: '8px 4px' }}>
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
                width: width - DESCRIPTION_PADDING,
                maxHeight: `${descriptionHeight(activeProject.description, width)}px`,
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
        <SamplesTable
          tableHeight={samplesTableHeight(activeProject.description, height, width)}
          ref={samplesTableRef}
        />
      </Space>
    </div>
  );
};

ProjectDetails.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default ProjectDetails;
