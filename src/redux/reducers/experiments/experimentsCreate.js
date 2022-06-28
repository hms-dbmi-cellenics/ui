import { experimentTemplate } from 'redux/reducers/experiments/initialState';

const experimentCreate = (state, action) => {
  const {
    experiment: {
      id, name, description, createdDate,
    },
  } = action.payload;

  const newExperiment = {
    ...experimentTemplate,
    id,
    name,
    description,
    projectUuid: id,
    createdDate,
  };

  return {
    ...state,
    ids: [...state.ids, newExperiment.id],
    [newExperiment.id]: newExperiment,
    meta: {
      ...state.meta,
      activeExperimentId: newExperiment.id,
      saving: false,
    },
  };
};

export default experimentCreate;
