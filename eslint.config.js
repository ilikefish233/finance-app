import eslintConfigNext from "eslint-config-next";

export default [
  ...eslintConfigNext,
  {
    ignores: [
      "node_modules/",
      ".next/",
      "build/",
      "*.cjs",
      "scripts/",
      "types/prisma.d.ts",
      "*.test.ts",
      "*.spec.ts",
      ".env",
      ".env.local",
      ".env.*.local",
    ],
  },
];
