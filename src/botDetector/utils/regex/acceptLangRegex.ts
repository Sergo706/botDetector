import { anyOf, createRegExp, exactly, digit, letter, maybe } from "magic-regexp";

const space = anyOf(" ", "\t").times.any();

const decimalZero = maybe(anyOf(exactly(".", digit.times.between(1, 3))));
const qZero = exactly("0", decimalZero);

const decimalOne = maybe(anyOf(exactly(".", exactly("0").times.between(1, 3))));
const qOne = exactly("1", decimalOne);

const qValue = anyOf(qZero, qOne);

const quality = maybe(
  anyOf(
    exactly(space, ";", space, "q", space, "=", space, qValue)
  )
);

const primaryTag = letter.times.between(1, 8);
const subTag = anyOf(
  exactly("-", anyOf(letter, digit).times.between(1, 8))
).times.any();

const acceptLang = anyOf(
  exactly("*"),
  exactly(primaryTag, subTag) 
);

const language = exactly(acceptLang, quality);
const repeatingLanguages = anyOf(
  exactly(space, ",", space, language)
).times.any();

export const acceptLanguageValidator = createRegExp(
  exactly(language, repeatingLanguages)
    .at.lineStart()
    .at.lineEnd(), 
  ["i"]
);