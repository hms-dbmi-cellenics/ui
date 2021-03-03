import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Space } from 'antd';
import { blue } from '@ant-design/colors';

import FileUploadModal from './FileUploadModal';

const ProjectsList = (props) => {
  const { height, projects, activeProjectIdx } = props;

  const [activeProject, setActiveProject] = useState(0);
  const [uploadModalVisible, setUploadModalVisible] = useState(true);

  useEffect(() => {
    setActiveProject(activeProjectIdx);
  }, [activeProjectIdx]);

  useEffect(() => {
    setUploadModalVisible(projects[activeProject]?.numSamples === 0);
  }, [projects, activeProject]);

  const activeProjectStyle = {
    backgroundColor: blue[0],
    cursor: 'pointer',
    border: `2px solid ${blue.primary}`,
  };

  const uploadFiles = () => {
    setUploadModalVisible(false);
  };

  return (
    <>
      <FileUploadModal
        visible={uploadModalVisible}
        onCancel={() => { setUploadModalVisible(false); }}
        onUpload={uploadFiles}
      />
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
              {`Created : ${project.createdDate}`}
              <br />
              {`Modified : ${project.lastModified}`}
              <br />
              {`No. Samples : ${project.numSamples}`}
              <br />
              {`Last Analyzed : ${project.lastAnalyzed}`}
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
  activeProjectIdx: PropTypes.number,
};

ProjectsList.defaultProps = {
  projects: [],
  height: 800,
  activeProjectIdx: 0,
};

export default ProjectsList;
