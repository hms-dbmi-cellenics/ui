# Description
<!---  Write a brief description of what your code does and how it relates to the issue it is resolving or feature enhancement it is implementing. -->

# Details
#### URL to issue
<!---
  Delete this comment and include the URL of the issue the pull request is related to.
  If no issue exists for this PR, replace this comment with N/A.

  Your pull request will not pass the required checks if this is not followed.
-->

#### Link to staging deployment URL (or set N/A)
<!---
  Delete this comment and include the URL of the staging environment for this pull request.
  Refer to https://github.com/biomage-org/biomage-utils#stage on how to stage a staging environment.
  If a staging environment for testing is not necessary for this PR, replace this comment with N/A 
  and explain why a staging environment is not required for this PR.

  Your pull request will not pass the required checks if this is not followed.
-->

#### Links to any PRs or resources related to this PR
<!---
  Delete this comment and include the URLs of any pull requests that are related to this PR.
  Place each PR on a new line.
-->

#### Integration test branch
master
<!---
  The branch of the integration test this PR will be run against

  If you DID NOT modify the integration tests for this PR, this can be left as `master`.

  If you DID modify the integration tests for this PR, add the name of the branch you created
  in biomage-org/testing that will be used to test this branch.
-->

# Merge checklist
Your changes will be ready for merging after all of the steps below have been completed.
<!---
  The required checks will not pass until all the boxes below have been checked.
-->

### Code updates
Have best practices and ongoing refactors being observed in this PR
- [ ] Migrated any selector / reducer used to the new format.

### Manual/unit testing
- [ ] Tested changes using InfraMock locally **or** no tests required for change, e.g. Kubernetes chart updates.
- [ ] Validated that current unit tests for code work as expected and are sufficient for code coverage **or** no unit tests required for change, e.g. documentation update.
- [ ] Unit tests written **or** no unit tests required for change, e.g. documentation update.

<!---
  Download the latest production data using `biomage experiment pull`.
  To set up easy local testing with inframock, follow the instructions here: https://github.com/biomage-org/inframock
  To deploy to the staging environment, follow the instructions here: https://github.com/biomage-org/biomage-utils
-->

### Integration testing
**You must check the box below** to run integration tests on the latest commit on your PR branch.
Integration tests have to pass before the PR can be merged. Without checking the box, your PR
**will not pass** the required status checks for merging.

- [ ] Started end-to-end tests on the latest commit.

### Documentation updates
- [ ] Relevant Github READMEs updated **or** no GitHub README updates required.
- [ ] Relevant Wiki pages created/updated **or** no Wiki updates required.

### Optional
- [ ] Staging environment is unstaged before merging.
- [ ] Photo of a cute animal attached to this PR.
