import { acceptLanguageValidator } from "../utils/regex/acceptLangRegex.js";
import { IBotChecker, BanReasonCode } from "../types/checkersTypes.js";
import { ValidationContext } from "../types/botDetectorTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { CheckerRegistry } from "./CheckerRegistry.js";

export class LocaleMapChecker implements IBotChecker<BanReasonCode> {
  name = 'Locale and Country Verification';
  phase = 'cheap' as const;

  isEnabled(config: BotDetectorConfig): boolean {
    return config.checkers.localeMapsCheck.enable;
  }

  async run(ctx: ValidationContext, config: BotDetectorConfig) {
    const settings = config.checkers.localeMapsCheck;
    const reasons: BanReasonCode[] = [];
    let score = 0;

    if (settings.enable === false) return { score, reasons };

    const AccHeader = ctx.req.get('Accept-Language') || '';
    if (!AccHeader) {
      score += settings.penalties.missingHeader;
      if (score > 0) reasons.push('LOCALE_MISMATCH');
      return { score, reasons };
    }

    const isValidHeader = acceptLanguageValidator.test(AccHeader.trim().toLowerCase());

    if (!isValidHeader) {
        score += settings.penalties.malformedHeader; 
        if (score > 0) reasons.push('LOCALE_MISMATCH');
        return { score, reasons };
    }

    const langs = AccHeader
      .split(',')
      .map(entry => {
        const [tag, q] = entry.trim().split(/\s*;\s*q\s*=\s*/);
        return { tag: tag.toLowerCase(), weight: q ? parseFloat(q) : 1 };
      })
      .sort((a, b) => b.weight - a.weight);

    const country = ctx.geoData.country;
    const countryCode = ctx.geoData.countryCode;
    const iso6 = ctx.geoData.iso639;

    if (!country || !countryCode || !iso6) {
      score += settings.penalties.missingGeoData;
      if (score > 0) reasons.push('LOCALE_MISMATCH');
      return { score, reasons };
    }

    const expectedCountryCode = countryCode.toLowerCase();
    const expectedLang = iso6.toLowerCase();
    const combined = `${expectedLang}-${expectedCountryCode}`;

    let localeMatchesGeo = false;

    for (const { tag, weight } of langs) {
      if (weight === 0) continue;
      const parts = tag.split(/[-_]/);
      const langPart = parts[0];
      const regionPart = parts.find(p => p.length === 2 && p === expectedCountryCode);
      
      if (regionPart) {
          localeMatchesGeo = true;
          break;
      }

      if (langPart === expectedLang) {
          localeMatchesGeo = true;
          break;
      }

      if ((langPart && regionPart) && tag === combined) {
          localeMatchesGeo = true;
          break;
      }
    }

    if (!localeMatchesGeo) {
      score += settings.penalties.ipAndHeaderMismatch;
      if (score > 0) reasons.push('LOCALE_MISMATCH');
    }

    return { score, reasons };
  }
}

CheckerRegistry.register(new LocaleMapChecker());