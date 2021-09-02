import React from 'react';
import PropTypes from 'prop-types';
import {
  Card, Descriptions,
} from 'antd';
import { blue } from '@ant-design/colors';
import EditableField from '../EditableField';
import PrettyTime from '../PrettyTime';

const activeProjectStyle = {
  backgroundColor: blue[0],
  cursor: 'pointer',
  border: `2px solid ${blue.primary}`,
};

const ProjectCard = (props) => {
  const {
    project, isActive, onClick, onSubmit, onDelete, validationFn,
  } = props;

  const { uuid } = project;

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
        <Descriptions.Item contentStyle={{ fontWeight: 700, fontSize: 16 }}>
          <EditableField
            value={project.name}
            onAfterSubmit={onSubmit}
            onDelete={onDelete}
            validationFunc={validationFn}
          />
        </Descriptions.Item>
        <Descriptions.Item
          labelStyle={{ fontWeight: 'bold' }}
          label='Samples'
        >
          {project.samples.length}

        </Descriptions.Item>
        <Descriptions.Item
          labelStyle={{ fontWeight: 'bold' }}
          label='Created'
        >
          <PrettyTime isoTime={project.createdDate} />

        </Descriptions.Item>
        <Descriptions.Item
          labelStyle={{ fontWeight: 'bold' }}
          label='Modified'
        >
          <PrettyTime isoTime={project.lastModified} />

        </Descriptions.Item>
        <Descriptions.Item
          labelStyle={{ fontWeight: 'bold' }}
          label='Last analyzed'
        >
          {project.lastAnalyzed ? (
            <PrettyTime isoTime={project.lastAnalyzed} />
          ) : ('never')}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

ProjectCard.propTypes = {
  project: PropTypes.object.isRequired,
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
