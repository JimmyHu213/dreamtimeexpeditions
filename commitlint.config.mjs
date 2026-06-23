export default {
  extends: ["@commitlint/config-conventional"],
  ignores: [
    // Dependabot subjects ("Bump X from Y to Z") are sentence-case, which
    // conflicts with the subject-case rule. We don't control these messages.
    (message) => /^(chore|build|fix)\(deps[^)]*\): bump /i.test(message),
  ],
};
