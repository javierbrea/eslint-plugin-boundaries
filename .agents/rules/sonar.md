---
paths:
  - "**/sonar-project.properties"
  - "packages/config/**/*.ts"
  - "packages/policies/**/*.ts"
  - "packages/elements/**/*.ts"
  - "packages/eslint-plugin/**/*.ts"
  - "support/eslint-config/index.js"
---

# SonarCloud issues

- A `sonar-project.properties` never silences issues: it has no `sonar.issue.ignore.*` key, which would also hide the real issues of the same rule or files.
- An issue that marks code that is right as it is gets accepted in SonarCloud, with a comment that says why. Illustrative cases: a package that reads its own deprecated settings, options or names to keep supporting them (`typescript:S1874`), or a public type alias kept for backward compatibility (`typescript:S6564`). Any other issue is fixed in the code, never hidden with `// NOSONAR` or with an alias or a cast that only exists to avoid the rule.
- Accepting an issue needs a SonarCloud token of the maintainer and changes the project for everyone, so the maintainer sees the issues and the comment and confirms before they are accepted.
- The open issues of a project are listed without a token at `https://sonarcloud.io/api/issues/search?componentKeys=<sonar.projectKey>&branch=release&issueStatuses=OPEN`.
- Lint runs the SonarCloud rules that `eslint-plugin-sonarjs` implements (`sonarjsConfig` in `support/eslint-config/index.js`). An upgrade of the plugin checks `SONARJS_RULES_NOT_IN_SONARCLOUD` again against its recommended config and the "Sonar way comprehensive" profile.
- A sonarjs lint finding on code that is right as it is is turned off on its line with `eslint-disable-next-line sonarjs/<rule> -- <reason>`, or in the project's `eslint.config.*` with a comment when a whole kind of file has it. If the analysis raises the same issue, it is accepted in SonarCloud as above.
