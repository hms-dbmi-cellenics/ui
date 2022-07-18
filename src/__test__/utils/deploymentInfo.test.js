import {
  DomainName, privacyPolicyIsNotAccepted,
} from 'utils/deploymentInfo';

describe('deploymentInfo', () => {
  describe('privacyPolicyIsNotAccepted', () => {
    it('Returns false for users that accepted privacy policy', () => {
      const user = { attributes: { 'custom:agreed_terms': 'true' } };
      const domainName = DomainName.BIOMAGE;

      expect(privacyPolicyIsNotAccepted(user, domainName)).toEqual(false);
    });

    it('Returns false for users that arent in Biomage deployment', () => {
      const user = { attributes: {} };
      const domainName = 'Someotherdomain.com';

      expect(privacyPolicyIsNotAccepted(user, domainName)).toEqual(false);
    });

    it('Returns true for users that still need to accept terms in Biomage', () => {
      const user = { attributes: {} };
      const domainName = DomainName.BIOMAGE;

      expect(privacyPolicyIsNotAccepted(user, domainName)).toEqual(true);
    });
  });
});
