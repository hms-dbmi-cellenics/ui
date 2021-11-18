import { EXPERIMENTS_SWITCH } from 'redux/actionTypes/experiments';

const switchExperiment = () => async (dispatch) => {
  dispatch({
    type: EXPERIMENTS_SWITCH,
  });
};
export default switchExperiment;
