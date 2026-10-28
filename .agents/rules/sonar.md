---
paths:
  - "**/sonar-project.properties"
---

# SonarCloud issues

- A `sonar-project.properties` never silences issues: it has no `sonar.issue.ignore.*` key, which would also hide the real issues of the same rule or files.
- An issue that marks code that is right as it is gets accepted in SonarCloud, with a comment that says why. Illustrative cases: a package that reads its own deprecated settings, options or names to keep supporting them (`typescript:S1874`), or a public type alias kept for backward compatibility (`typescript:S6564`). Any other issue is fixed in the code, never hidden with `// NOSONAR` or with an alias or a cast that only exists to avoid the rule.
- Accepting an issue needs a SonarCloud token of the maintainer and changes the project for everyone, so the maintainer sees the issues and the comment and confirms before they are accepted.
- The open issues of a project are listed without a token at `https://sonarcloud.io/api/issues/search?componentKeys=<sonar.projectKey>&branch=release&issueStatuses=OPEN`.
