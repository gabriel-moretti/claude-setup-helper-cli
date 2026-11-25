// ESLint cobre só o que o Biome não cobre: regras type-aware e plugins de framework.
// Formatação e lint geral ficam com o Biome.
import tseslint from "typescript-eslint";
import biome from "eslint-config-biome";

export default tseslint.config(
  { ignores: ["dist/**", ".next/**", "coverage/**", "**/*.config.{js,mjs,cjs}"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
    },
  },
  // Plugins de framework entram aqui (ex.: Next.js / react-hooks — ou via skill harness-nextjs)

  // Sempre por último: desliga no ESLint as regras que o Biome já cobre
  biome,
);
