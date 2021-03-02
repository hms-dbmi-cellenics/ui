import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Space } from 'antd';
import { blue } from '@ant-design/colors';

import FileUploadModal from './FileUploadModal';

const ProjectsList = (props) => {
  const { height, projects } = props;

  const [activeProject, setActiveProject] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    setIsModalVisible(projects[activeProject].numSamples === 0);
  }, [projects]);

  const activeProjectStyle = {
    backgroundColor: blue[0],
    cursor: 'pointer',
    border: `2px solid ${blue.primary}`,
  };

  return (
    <>
      <FileUploadModal visible={isModalVisible} />
      <Space direction='vertical' style={{ width: '100%', height: height - 90 }}>
        {
          projects.map((project, idx) => (
            <Card
              key={idx}
              type='primary'
              style={activeProject === idx ? activeProjectStyle : { cursor: 'pointer' }}
              onClick={() => setActiveProject(idx)}
            >
              <strong><p>{project.name}</p></strong>
              Created :
              {' '}
              {project.createdDate}
              <br />
              Modified :
              {' '}
              {project.lastModified}
              <br />
              No. Samples :
              {' '}
              {project.numSamples}
              <br />
              Last Analyzed :
              {' '}
              {project.lastAnalyzed}
              <br />
            </Card>
          ))
        }
      </Space>
    </>
  );
};

const ProjectsObj = PropTypes.shape({
  name: PropTypes.string,
  createdDate: PropTypes.string,
  lastModified: PropTypes.string,
  numSamples: PropTypes.number,
  lastAnalyzed: PropTypes.string,
});

ProjectsList.propTypes = {
  projects: PropTypes.arrayOf(ProjectsObj),
  height: PropTypes.number,
};

const testProjects = [
  {
    name: 'Project 1',
    createdDate: 1,
    lastModified: 1,
    numSamples: 0,
    lastAnalyzed: 1,
  },
  {
    name: 'Project 2',
    createdDate: 1,
    lastModified: 1,
    numSamples: 1,
    lastAnalyzed: 1,
  },
  {
    name: 'Project 3',
    createdDate: 1,
    lastModified: 1,
    numSamples: 0,
    lastAnalyzed: 1,
  },
  {
    name: 'Project 1',
    createdDate: 1,
    lastModified: 1,
    numSamples: 1,
    lastAnalyzed: 1,
  },
  {
    name: 'Project 2',
    createdDate: 1,
    lastModified: 1,
    numSamples: 1,
    lastAnalyzed: 1,
  },
  {
    name: 'Project 3',
    createdDate: 1,
    lastModified: 1,
    numSamples: 1,
    lastAnalyzed: 1,
  },
];

ProjectsList.defaultProps = {
  projects: testProjects,
  height: 800,
};

export default ProjectsList;
