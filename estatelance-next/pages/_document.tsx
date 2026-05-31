import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="google-site-verification" content="VRFENrwRjM4ww5GdWgSECw6guWew_Xbt5mDZW00IZfE" />
        <meta name="description" content="BuFu — Build Future. O'zbekistondagi frilanserlar platformasi. Mutaxassis toping yoki o'z xizmatlaringizni taklif qiling." />
        <meta name="theme-color" content="#6366f1" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bufu.uz" />
        <meta property="og:title" content="BuFu — Build Future" />
        <meta property="og:description" content="O'zbekistondagi frilanserlar platformasi. Mutaxassis toping yoki o'z xizmatlaringizni taklif qiling." />
        <meta property="og:image" content="https://bufu.uz/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="BuFu" />
        <meta property="og:locale" content="uz_UZ" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BuFu — Build Future" />
        <meta name="twitter:description" content="O'zbekistondagi frilanserlar platformasi." />
        <meta name="twitter:image" content="https://bufu.uz/og-image.png" />

        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
