import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Space, Skeleton } from 'antd';
import { FixedSizeList as List } from 'react-window';
import integrationTestConstants from 'utils/integrationTestConstants';
import ProjectCard from './ProjectCard';

const windowMargin = 130;

const Row = ({ index, data, style }) => {
  const experiment = data[index];

  return (
    <Space style={{ ...style, width: '100%' }}>
      <ProjectCard key={experiment.id} experimentId={experiment.id} />
    </Space>
  );
};

const ProjectsList = (props) => {
  const { height, filter } = props;

  const experiments = useSelector((state) => state.experiments);

  if (experiments.meta.loading) {
    return [...Array(5)].map((_, idx) => <Skeleton key={`skeleton-${idx}`} role='progressbar' active />);
  }

  const filteredExperiments = experiments.ids
    .map((id) => experiments[id])
    .filter((exp) => (exp.name.match(filter) || exp.id.match(filter)));
  if (filteredExperiments.length === 0) {
    return (
      <div data-test-id={integrationTestConstants.ids.PROJECTS_LIST} />
    );
  }

  return (
    <div data-test-id={integrationTestConstants.ids.PROJECTS_LIST}>
      <List
        height={height - windowMargin}
        itemCount={filteredExperiments.length}
        itemSize={220}
        itemData={filteredExperiments}
        width='100%'
      >
        {Row}
      </List>
    </div>
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
