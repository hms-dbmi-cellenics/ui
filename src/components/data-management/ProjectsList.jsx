import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Space, Skeleton } from 'antd';

import ProjectCard from './ProjectCard';

// header height: 30 px
// Padding top : 10 px
// Crete new project button : 32
// Gap : 8 px
// Filter project input : 32 px
// Gap : 8 px
// Padding botton : 10 px
// Total : 130 px
const windowMargin = 130; // px

const ProjectsList = (props) => {
  const { height, filter } = props;

  const projects = useSelector((state) => state.projects);

  if (projects.meta.loading) {
    return [...Array(5)].map((_, idx) => <Skeleton key={`skeleton-${idx}`} role='progressbar' active />);
  }

  return (
    <>
      <Space direction='vertical' style={{ height: height - windowMargin, overflowY: 'auto' }}>
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
    </>
  );
};

ProjectsList.propTypes = {
  height: PropTypes.number,
  filter: PropTypes.object.isRequired,
};

ProjectsList.defaultProps = {
  height: 800,
};

export default ProjectsList;
