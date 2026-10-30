import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { BackLink } from "../components/ui/BackLink";
import { useAuthStore } from "../stores/authStore";

export function LoginPage() {
  const { sendMagicLink, verifyOtp, loading, error, member, session } =
    useAuthStore();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);

  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/messagerie";

  if (session && member) return <Navigate to={redirectTo} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch {
      // erreur dans le store
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyOtp(email, code);
    } catch {
      // erreur dans le store
    }
  };

  if (sent) {
    return (
      <div
        className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center space-y-8 py-4"
        data-testid="login-otp-page"
      >
        <BackLink to="/" label="Accueil" data-testid="login-back-link" />
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-warm-600">
            Espace privé
          </p>
          <h1 className="page-title mt-2" data-testid="login-otp-title">
            Vérifie tes emails
          </h1>
          <p className="page-subtitle">
            On vient d&apos;envoyer un email à <strong>{email}</strong>. Clique
            sur le lien qu&apos;il contient, ou recopie le code à 8 chiffres
            ci-dessous.
          </p>
        </div>

        <form
          onSubmit={handleVerify}
          className="card space-y-4"
          data-testid="login-otp-form"
        >
          <div>
            <label
              htmlFor="code"
              className="mb-1 block text-sm font-medium text-ink-700"
            >
              Code reçu par email
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              data-testid="login-otp-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="input-field"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" data-testid="login-otp-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            data-testid="login-otp-submit-button"
          >
            {loading ? "Vérification..." : "Valider le code"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-sm text-warm-700 hover:underline"
          data-testid="login-otp-restart-button"
        >
          Mauvais email ? Recommencer
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-8 py-4" data-testid="login-page">
      <BackLink to="/" label="Accueil" data-testid="login-back-link" />
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-warm-600">
          Espace privé
        </p>
        <h1 className="page-title mt-2" data-testid="login-title">
          Connexion
        </h1>
        <p className="page-subtitle">
          Réservé aux membres de la Famille Arbey. Entre ton email, on
          t&apos;envoie un lien de connexion.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card space-y-4"
        data-testid="login-form"
      >
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-ink-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            data-testid="login-email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" data-testid="login-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
          data-testid="login-submit-button"
        >
          {loading ? "Envoi..." : "Recevoir le lien de connexion"}
        </button>
      </form>

      <p className="text-center text-sm text-ink-500">
        Pas encore de compte ?{" "}
        <Link
          to="/demande-acces"
          className="font-medium text-warm-700 hover:underline"
          data-testid="login-request-access-link"
        >
          Demander l&apos;accès
        </Link>
      </p>
    </div>
  );
}
