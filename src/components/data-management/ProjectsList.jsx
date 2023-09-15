import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Table, Skeleton } from 'antd';
import { useVT } from 'virtualizedtableforantd4';

import integrationTestConstants from 'utils/integrationTestConstants';
import ProjectCard from './ProjectCard';
// This makes sure that all the projects can be viewed properly inside the list
// TODO : This has to be done properly in CSS
const windowMargin = 130; // px

const ProjectsList = (props) => {
  const { height, filter } = props;

  const experiments = useSelector((state) => state.experiments);
  const [vt] = useVT(() => ({
    scroll: {
      y: height - windowMargin,
    },
  }), [height]);

  if (experiments.meta.loading) {
    return [...Array(5)].map((_, idx) => <Skeleton key={`skeleton-${idx}`} role='progressbar' active />);
  }
  // if there are no element return an emtpy one so that the tests know the list has been loaded

  if (experiments.ids.length === 0) {
    return (
      <div data-test-id={integrationTestConstants.ids.PROJECTS_LIST} />
    );
  }

  const dataSource = experiments.ids.map((experimentId) => {
    const experiment = experiments[experimentId];
    const matchFilter = experiment.name.match(filter) || experimentId.match(filter);
    if (!matchFilter) return <></>;

    return {
      key: experiment.id,
      content: (
        <ProjectCard
          experimentId={experiment.id}
        />
      ),
    };
  }).filter(Boolean);
  const columns = [{
    dataIndex: 'content',
    render: (content) => content,
  }];

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      pagination={false}
      components={vt}
      scroll={{ y: height - windowMargin }}
      data-test-id={integrationTestConstants.ids.PROJECTS_LIST}
      showHeader={false}
      bordered={false}
    />
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
