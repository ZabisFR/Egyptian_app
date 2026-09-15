import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Le préfixe `_` marque une variable volontairement inutilisée. Le cas qui
      // l'impose ici : react-markdown passe une prop `node` que l'on doit extraire
      // par déstructuration pour qu'elle ne finisse pas étalée sur l'élément DOM,
      // où React la signalerait comme attribut inconnu. La variable est donc
      // nécessairement déclarée et nécessairement inutilisée.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
