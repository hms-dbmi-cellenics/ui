import {
  decrypt,
  encrypt,
} from '../../utils/crypt';

describe('Crypt module', () => {
  it('returns the original text after encrypt / decrypt', () => {
    const randomData = 'oklfjasdof8923';
    expect(randomData).toEqual(decrypt(encrypt(randomData)));
  });
});
