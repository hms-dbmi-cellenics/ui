import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Space, Skeleton } from 'antd';

import integrationTestConstants from 'utils/integrationTestConstants';
import ProjectCard from './ProjectCard';

// This makes sure that all the projects can be viewed properly inside the list
// TODO : This has to be done properly in CSS
const windowMargin = 130; // px

const ProjectsList = (props) => {
  const { height, filter } = props;

  const projects = useSelector((state) => state.projects);

  if (projects.meta.loading) {
    return [...Array(5)].map((_, idx) => <Skeleton key={`skeleton-${idx}`} role='progressbar' active />);
  }

  // if there are no element return an emtpy one so that the tests know the list has been loaded
  if (projects.ids.length === 0) {
    return (
      <div data-test-id={integrationTestConstants.ids.PROJECTS_LIST} />
    );
  }

  return (
    <Space
      data-test-id={integrationTestConstants.ids.PROJECTS_LIST}
      direction='vertical'
      style={{ height: height - windowMargin, overflowY: 'auto' }}
    >
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

ProjectsList.propTypes = {
  height: PropTypes.number,
  filter: PropTypes.object.isRequired,
};

ProjectsList.defaultProps = {
  height: 800,
};

export default ProjectsList;
