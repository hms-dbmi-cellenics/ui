import { getAccountId } from 'utils/awsConfig';

describe('aws config functios ', () => {
  it('get account id works for development', () => {
    const accountID = getAccountId('development');
    expect(accountID).toEqual('000000000000');
  });

  it('get account id for not development makes aws sts calls', () => {

  });

  it('Get aws region works', () => {

  });
});
