import produce from 'immer';
// called when an experiment is deleted - deletes the backend status

const backendStatusDeleted = produce((draft, action) => {
  const { experimentIds } = action.payload;

  experimentIds.forEach((id) => {
    // eslint-disable-next-line no-param-reassign
    delete draft[id];
  });
});

export default backendStatusDeleted;
