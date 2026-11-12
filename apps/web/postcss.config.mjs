// PostCSS pipeline for the whole app (Next.js has one project-wide
// config, it cannot be scoped per route) — see
// styles/tailwind-foundation.css for why that is safe here.
//
// autoprefixer is kept alongside Tailwind's own plugin because adding
// this file replaces Next's internal zero-config CSS pipeline, which
// app/globals.css was implicitly relying on.
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};

export default config;
