import React, { useCallback, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Space, Skeleton } from 'antd';
import { VariableSizeList as List } from 'react-window';
import integrationTestConstants from 'utils/integrationTestConstants';
import ProjectCard from './ProjectCard';

// This makes sure that all the projects can be viewed properly inside the list
// TODO : This has to be done properly in CSS
const windowMargin = 130;// px

const Row = ({
  index, data, style, setSize,
}) => {
  const rowRef = useRef();
  const experiment = data[index];

  useEffect(() => {
    if (rowRef.current) {
      setSize(index, rowRef.current.getBoundingClientRect().height);
    }
  }, [setSize, index, experiment]);

  return (
    <Space style={{ ...style, width: '100%' }}>
      <div ref={rowRef}>
        <ProjectCard key={experiment.id} experimentId={experiment.id} />
      </div>
    </Space>
  );
};

const ProjectsList = (props) => {
  const { height, filter } = props;
  const listRef = useRef();
  const sizeMap = useRef({});

  const experiments = useSelector((state) => state.experiments);

  const setSize = useCallback((index, size) => {
    sizeMap.current[index] = size + 5;
    //  if the height gets changed, we need to reset the heights
    // so that they are recalculated
    listRef.current.resetAfterIndex(index);
  }, []);

  const getSize = (index) => sizeMap.current[index] || 204; // default height if not yet measured

  const filteredExperiments = experiments.ids
    .map((id) => experiments[id])
    .filter((exp) => (exp.name.match(filter) || exp.id.match(filter)));

  if (experiments.meta.loading) {
    return ([...Array(5)].map((_, idx) => <Skeleton key={`skeleton-${idx}`} role='progressbar' active />));
  } if (filteredExperiments.length === 0) {
    return (<div data-test-id={integrationTestConstants.ids.PROJECTS_LIST} />);
  }
  return (
    <div data-test-id={integrationTestConstants.ids.PROJECTS_LIST}>
      <List
        ref={listRef}
        height={height - windowMargin}
        width='100%'
        itemCount={filteredExperiments.length}
        itemSize={getSize}
        itemData={filteredExperiments}
      >
        {({ data, index, style }) => (
          <Row
            data={data}
            index={index}
            style={style}
            setSize={setSize}
          />
        )}
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
