import { EXPERIMENT_SETTINGS_ADD_CHANGED_QC_FILTER } from '../../../actionTypes/experimentSettings';

const addChangedQCFilter = (stepKey) => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_ADD_CHANGED_QC_FILTER,
    payload: { stepKey },
  });
};

export default addChangedQCFilter;
