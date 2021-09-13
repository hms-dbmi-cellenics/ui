import React from 'react';
import PropTypes from 'prop-types';
import {
  Card, Descriptions,
} from 'antd';
import { blue } from '@ant-design/colors';
import { useSelector } from 'react-redux';
import EditableField from '../EditableField';
import PrettyTime from '../PrettyTime';

const { Item } = Descriptions;

const activeProjectStyle = {
  backgroundColor: blue[0],
  cursor: 'pointer',
  border: `2px solid ${blue.primary}`,
};

const ProjectCard = (props) => {
  const {
    uuid, isActive, onClick, onSubmit, onDelete, validationFn,
  } = props;

  const project = useSelector((state) => state.projects[uuid]);

  return (
    <Card
      data-test-class='project-card'
      key={uuid}
      type='primary'
      style={isActive ? activeProjectStyle : { cursor: 'pointer' }}
      onClick={onClick}
    >
      <Descriptions
        layout='horizontal'
        size='small'
        column={1}
      >
        <Item contentStyle={{ fontWeight: 700, fontSize: 16 }}>
          <EditableField
            value={project.name}
            onAfterSubmit={onSubmit}
            onDelete={onDelete}
            validationFunc={validationFn}
          />
        </Item>
        <Item
          labelStyle={{ fontWeight: 'bold' }}
          label='Samples'
        >
          {project.samples.length}

        </Item>
        <Item
          labelStyle={{ fontWeight: 'bold' }}
          label='Created'
        >
          <PrettyTime isoTime={project.createdDate} />

        </Item>
        <Item
          labelStyle={{ fontWeight: 'bold' }}
          label='Modified'
        >
          <PrettyTime isoTime={project.lastModified} />

        </Item>
        <Item
          labelStyle={{ fontWeight: 'bold' }}
          label='Last analyzed'
        >
          {project.lastAnalyzed ? (
            <PrettyTime isoTime={project.lastAnalyzed} />
          ) : ('never')}
        </Item>
      </Descriptions>
    </Card>
  );
};

ProjectCard.propTypes = {
  uuid: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
  onSubmit: PropTypes.func,
  onDelete: PropTypes.func,
  validationFn: PropTypes.func,
};

ProjectCard.defaultProps = {
  isActive: false,
  onClick: () => {},
  onSubmit: () => {},
  onDelete: () => {},
  validationFn: () => {},
};

export default ProjectCard;
