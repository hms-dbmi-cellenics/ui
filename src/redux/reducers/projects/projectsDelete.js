import _ from 'lodash';

const projectsDelete = (state, action) => {
  const { projectUuid } = action.payload;

  let updatedObject = null;

  if (!_.has(state, projectUuid)) {
    return state;
  }

  updatedObject = _.omit(state, projectUuid);
  updatedObject.ids = updatedObject.ids.filter((p) => p !== projectUuid);

  return updatedObject;
};

export default projectsDelete;
