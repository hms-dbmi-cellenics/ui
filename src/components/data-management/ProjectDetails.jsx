/* eslint-disable react/jsx-props-no-spreading */
import React, { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  Space, Col, Row, Typography, Button,
} from 'antd';
import PropTypes from 'prop-types';
import SamplesTable from './SamplesTable';
import ProjectMenu from './ProjectMenu';
import {
  updateProject,
} from '../../redux/actions/projects';

const { Title, Text, Paragraph } = Typography;

const ProjectDetails = ({ width, height }) => {
  const PADDING_HEIGHT = 120; // px
  const HEADER_HEIGHT = 100; // px
  const MAX_DESCRIPTION_HEIGHT = 100; // px
  const FONT_SIZE = 16; // px
  const LINE_HEIGHT = 16; // px

  const dispatch = useDispatch();

  const { activeProjectUuid } = useSelector((state) => state.projects.meta);
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);

  const samplesTableRef = useRef();

  const calculateTextHeight = (text, screenWidth) => (Math.floor((text.length * FONT_SIZE) / screenWidth) + 1) * LINE_HEIGHT;

  const descriptionHeight = (text, screenWidth) => Math.min(calculateTextHeight(text, screenWidth), MAX_DESCRIPTION_HEIGHT);

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
                width: width - FONT_SIZE * 2,
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
          tableHeight={height - descriptionHeight(activeProject.description, width) - HEADER_HEIGHT - PADDING_HEIGHT}
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
