import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Menu,
  Dropdown,
} from 'antd';
import Link from 'next/link';
import { Auth, Hub } from 'aws-amplify';
import endUserMessages from '../utils/endUserMessages';
import { resetTrackingId } from '../utils/tracking';
import pushNotificationMessage from '../utils/pushNotificationMessage';

const UserButton = () => {
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
          resetTrackingId();
          setUser(null);
          break;
        case 'signIn_failure':
        case 'cognitoHostedUI_failure':
          pushNotificationMessage('error', endUserMessages.ERROR_SIGN_IN);
          break;
        default:
          break;
      }
    });

    getUser().then((userData) => setUser(userData));
  }, []);

  const content = () => (
    <Menu>
      <Menu.ItemGroup key='g1' title={`Signed in as ${user.attributes.name}`} />
      <Menu.Item key='profile' disabled>Your profile</Menu.Item>
      <Menu.Item key='settings'>
        <Link href='/settings/profile'>
          Settings
        </Link>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key='logout' onClick={async () => Auth.signOut()}>Sign out</Menu.Item>
    </Menu>
  );

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
