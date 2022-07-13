import Auth from '@aws-amplify/auth';
import { USER_LOADED } from 'redux/actionTypes/user';

const loadUser = () => async (dispatch) => {
  try {
    const user = await Auth.currentAuthenticatedUser();

    dispatch({
      type: USER_LOADED,
      payload: { user },
    });
  } catch (e) {
    Auth.federatedSignIn();
  }
};

export default loadUser;
