import { LoginForm } from '../../../src/components/client-finder/LoginForm';

export const metadata = { title: 'Sign in — Client Finder' };
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <main id="main" className="shell">
      <header>
        <p className="eyebrow">Client Finder</p>
        <h1 className="page-title">Sign in</h1>
      </header>
      <LoginForm />
    </main>
  );
}
