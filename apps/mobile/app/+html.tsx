import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/** Evita que el traductor del navegador modifique el DOM y rompa la reconciliación de React. */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es" translate="no" className="notranslate">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="google" content="notranslate" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
