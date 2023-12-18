import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Card, Descriptions,
} from 'antd';
import { blue } from '@ant-design/colors';
import { useSelector, useDispatch } from 'react-redux';

import { updateExperiment, setActiveExperiment } from 'redux/actions/experiments';
import validateInputs, { rules } from 'utils/validateInputs';
import integrationTestConstants from 'utils/integrationTestConstants';
import EditableField from 'components/EditableField';
import PrettyTime from 'components/PrettyTime';

import ProjectDeleteModal from 'components/data-management/project/ProjectDeleteModal';

const { Item } = Descriptions;

const validationChecks = [
  rules.MIN_8_CHARS,
  rules.MIN_2_SEQUENTIAL_CHARS,
  rules.ALPHANUM_DASH_SPACE,
  rules.UNIQUE_NAME_CASE_INSENSITIVE,
];

const inactiveExperimentStyle = {
  cursor: 'pointer',
};

const activeExperimentStyle = {
  backgroundColor: blue[0],
  cursor: 'pointer',
  border: `2px solid ${blue.primary}`,
};

const itemTextStyle = { fontWeight: 'bold' };

const ProjectCard = (props) => {
  const { experimentId } = props;

  const dispatch = useDispatch();

  const experiments = useSelector((state) => state.experiments);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const { activeExperimentId } = experiments.meta;
  const experimentCardStyle = activeExperimentId === experimentId
    ? activeExperimentStyle : inactiveExperimentStyle;

  const experiment = experiments[experimentId];

  const experimentNames = experiments.ids.map((id) => experiments[id].name);

  const validationParams = {
    existingNames: experimentNames,
  };

  const updateExperimentName = (newName) => {
    dispatch(updateExperiment(experiment.id, { name: newName.trim() }));
  };

  const deleteExperiment = () => {
    setDeleteModalVisible(true);
  };

  return (
    <>
      {deleteModalVisible && (
        <ProjectDeleteModal
          key={`${experiment.id}-name`}
          experimentId={experiment.id}
          onCancel={() => { setDeleteModalVisible(false); }}
          onDelete={() => { setDeleteModalVisible(false); }}
        />
      )}
      <Card
        data-test-class={integrationTestConstants.classes.PROJECT_CARD}
        key={experimentId}
        type='primary'
        style={experimentCardStyle}
        onClick={() => {
          dispatch(setActiveExperiment(experiment.id));
        }}
      >
        <Descriptions
          layout='horizontal'
          size='small'
          column={1}
        >
          <Item contentStyle={{ fontWeight: 700, fontSize: 16 }}>
            <EditableField
              value={experiment.name}
              onAfterSubmit={updateExperimentName}
              onDelete={deleteExperiment}
              validationFunc={
                (newName) => validateInputs(
                  newName,
                  validationChecks,
                  validationParams,
                ).isValid
              }
            />
          </Item>
          <Item
            labelStyle={itemTextStyle}
            label='Samples'
          >
            {experiment.sampleIds.length}

          </Item>
          <Item
            labelStyle={itemTextStyle}
            label='Created'
          >
            <PrettyTime isoTime={experiment.createdAt} />

          </Item>
          <Item
            labelStyle={itemTextStyle}
            label='Modified'
          >
            <PrettyTime isoTime={experiment.updatedAt} />

          </Item>
        </Descriptions>
      </Card>
    </>
  );
};

ProjectCard.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default ProjectCard;
