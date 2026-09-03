export const generatedMutationNames = [
  "leading-comment",
  "trailing-comment",
  "safe-module-const",
  "safe-helper",
];

const comments = {
  js: "// canary mutation: syntax-preserving context\n",
  jsx: "// canary mutation: syntax-preserving context\n",
  ts: "// canary mutation: syntax-preserving context\n",
  tsx: "// canary mutation: syntax-preserving context\n",
};

const ensureSemicolonBoundary = (source) =>
  /[;}\n]\s*$/u.test(source) ? source : `${source};`;

export const applyGeneratedMutation = (source, language, mutation) => {
  const comment = comments[language] ?? "// canary mutation\n";
  switch (mutation) {
    case "leading-comment":
      return `${comment}${source}`;
    case "trailing-comment":
      return `${source}\n${comment.trimEnd()}\n`;
    case "safe-module-const":
      return `const __codingBibleCanarySentinel = true;\n${source}`;
    case "safe-helper":
      return `${ensureSemicolonBoundary(source)}\nfunction __codingBibleCanaryHelper() { return true; }\n`;
    default:
      throw new Error(`Unknown generated mutation: ${mutation}`);
  }
};

export const expandGeneratedMutations = ({ id, language, source }) =>
  generatedMutationNames.map((mutation) => ({
    id: `${id}--${mutation}`,
    language,
    mutation,
    source: applyGeneratedMutation(source, language, mutation),
  }));
