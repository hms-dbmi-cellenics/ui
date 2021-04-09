import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Menu,
  Dropdown,
} from 'antd';

import { useDispatch } from 'react-redux';
import { Auth, Hub } from 'aws-amplify';
import messages from './notification/messages';
import pushNotificationMessage from '../redux/actions/notifications';

const UserButton = () => {
  const dispatch = useDispatch();
  const [user, setUser] = useState();

  const getUser = () => Auth.currentAuthenticatedUser()
    .then((userData) => userData)
    .catch((e) => console.log('error during getuser', e));

  useEffect(() => {
    Hub.listen('auth', ({ payload: { event } }) => {
      switch (event) {
        case 'signIn':
        case 'cognitoHostedUI':
          getUser().then((userData) => setUser(userData));
          break;
        case 'signOut':
          setUser(null);
          break;
        case 'signIn_failure':
        case 'cognitoHostedUI_failure':
          dispatch(pushNotificationMessage('error', messages.signInError, 5));
          break;
        default:
          break;
      }
    });

    getUser().then((userData) => setUser(userData));
  }, []);

  const content = () => (
    // <button onClick={() => Auth.federatedSignIn()}>Open Hosted UI</button>
    <Menu>
      <Menu.ItemGroup key='g1' title={`Signed in as ${user.attributes.name}`} />
      <Menu.Item key='profile' disabled>Your profile</Menu.Item>
      <Menu.Item key='settings' disabled>Settings</Menu.Item>
      <Menu.Divider />
      <Menu.Item key='logout' onClick={async () => Auth.signOut()}>Sign out</Menu.Item>
    </Menu>
  );

  Hub.listen('auth', ({ payload: { event } }) => {
    switch (event) {
      case 'signIn':
      case 'cognitoHostedUI':
        getUser().then((userData) => setUser(userData));
        break;
      case 'signOut':
        setUser(null);
        break;
      case 'signIn_failure':
      case 'cognitoHostedUI_failure':

        // do something here
        break;
      default:
        break;
    }
  });

  // This eventually needs to become a Dropdown with a menu.
  // For now, we can just put the login stuff direclty into the popover.
  return user ? (
    <Dropdown overlay={content()} trigger={['click']}>
      <Button
        aria-label='User settings'
        type='text'
        style={{
          border: 'none',
          padding: 0,
          margin: 0,
        }}
        icon={(
          <Avatar
            style={{
              backgroundColor: '#f56a00', verticalAlign: 'middle',
            }}
            size='medium'
          >
            {user.attributes.name[0].toUpperCase()}
          </Avatar>
        )}
      />
    </Dropdown>
  ) : (
    <Button
      type='dashed'
      onClick={() => Auth.federatedSignIn()}
    >
      Sign in
    </Button>
  );
};

UserButton.propTypes = {
};

UserButton.defaultProps = {
};

export default UserButton;
