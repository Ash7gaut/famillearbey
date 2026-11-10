import { useState } from 'react';
import { CheckCircle2, Phone } from 'lucide-react';
import { formatNationalDigits, isValidFrenchPhone, parseFrenchNational } from '../profile/memberUtils';

interface PhoneInputProps {
  /** Valeur normalisée E.164 (+33612345678), partielle (+336) ou vide. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  'data-testid'?: string;
}

/**
 * Saisie d'un numéro français : préfixe +33 fixe, 9 chiffres nationaux formatés par paires.
 * Émet `''` si vide, sinon `+33` + chiffres saisis (complet = E.164 valide).
 */
export function PhoneInput({ value, onChange, id, 'data-testid': testId = 'phone-input' }: PhoneInputProps) {
  const [focused, setFocused] = useState(false);
  const national = parseFrenchNational(value);
  const valid = isValidFrenchPhone(value);
  const invalid = national.length > 0 && !focused && !valid;

  const border = invalid
    ? 'border-red-400 ring-1 ring-red-200 dark:border-red-500'
    : valid
      ? 'border-emerald-400 dark:border-emerald-500'
      : 'border-cream-300 focus-within:border-warm-400 focus-within:ring-1 focus-within:ring-warm-200';

  return (
    <div data-testid={`${testId}-wrapper`}>
      <div
        className={`flex max-w-xs items-center gap-2 rounded-xl border bg-white px-3 py-2 transition dark:bg-transparent ${border}`}
      >
        <Phone className="h-4 w-4 shrink-0 text-ink-400" strokeWidth={1.75} aria-hidden />
        <span
          className="shrink-0 rounded-md bg-cream-100 px-1.5 py-0.5 text-sm font-medium text-ink-600 dark:bg-white/10"
          data-testid={`${testId}-prefix`}
        >
          🇫🇷 +33
        </span>
        <input
          id={id}
          data-testid={testId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={formatNationalDigits(national)}
          onChange={(e) => {
            const digits = parseFrenchNational(e.target.value);
            onChange(digits ? `+33${digits}` : '');
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="6 12 34 56 78"
          aria-invalid={invalid}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink-800 outline-none placeholder:text-ink-300"
        />
        {valid && (
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-emerald-500"
            strokeWidth={1.75}
            data-testid={`${testId}-valid`}
          />
        )}
      </div>
      {invalid && (
        <p className="mt-1 text-xs text-red-600" data-testid={`${testId}-error`}>
          Numéro français invalide (9 chiffres, hors 08).
        </p>
      )}
    </div>
  );
}
