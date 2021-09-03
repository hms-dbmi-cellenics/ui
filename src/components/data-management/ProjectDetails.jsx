/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  Space, Col, Row, Typography, Button,
} from 'antd';
import PropTypes from 'prop-types';
import SamplesTableOld from './SamplesTableOld';
import ProjectMenu from './ProjectMenu';
import {
  updateProject,
} from '../../redux/actions/projects';

const { Title, Text, Paragraph } = Typography;

const ProjectDetails = ({ width, height }) => {
  const dispatch = useDispatch();

  const { activeProjectUuid } = useSelector((state) => state.projects.meta) || false;
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);

  const [creatingMetadataColumn, setCreatingMetadataColumn] = useState(false);

  console.log('***** ', creatingMetadataColumn);

  return (
    <div id='project-details' width={width} height={height}>
      <Space direction='vertical' style={{ width: '100%', padding: '8px 4px' }}>
        <Row style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Title level={3}>{activeProject?.name}</Title>
          <Space>
            <Button onClick={() => setCreatingMetadataColumn(true)}>Fake add metadata</Button>
            <ProjectMenu />
          </Space>
        </Row>
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
          {' '}

        </Row>
        <SamplesTableOld
          height={height}
          creatingMetadataColumn={creatingMetadataColumn}
          setCreatingMetadataColumn={setCreatingMetadataColumn}
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
