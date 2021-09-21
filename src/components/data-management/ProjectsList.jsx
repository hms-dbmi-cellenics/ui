import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Space } from 'antd';

import ProjectCard from './ProjectCard';

const ProjectsListContainer = (props) => {
  const { height, filter } = props;

  const projects = useSelector((state) => state.projects);

  return (
    <Space direction='vertical' style={{ width: '100%', height: height - 90 }}>
      {
        projects.ids.map((projectUuid) => {
          const project = projects[projectUuid];

          const matchFilter = project.name.match(filter)
              || project.experiments.some((experimentId) => experimentId.match(filter))
              || projectUuid.match(filter);

          if (!matchFilter) return <></>;

          return (
            <ProjectCard
              key={project.uuid}
              projectUuid={project.uuid}
            />
          );
        })
      }
    </Space>
  );
};

ProjectsListContainer.propTypes = {
  height: PropTypes.number,
  filter: PropTypes.object.isRequired,
};

ProjectsListContainer.defaultProps = {
  height: 800,
};

export default ProjectsListContainer;
