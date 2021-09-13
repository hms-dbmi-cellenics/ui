import produce from 'immer';
// type - BACKEND_STATUS_DELETED

const backendStatusDeleted = produce((draft, action) => {
  const { experimentIds } = action.payload;

  experimentIds.forEach((id) => {
    // eslint-disable-next-line no-param-reassign
    delete draft[id];
  });
});

export default backendStatusDeleted;
