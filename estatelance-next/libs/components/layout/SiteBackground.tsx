import React from 'react';

/** Global aurora mesh — barcha public sahifalar orqasida (fixed layer). */
export default function SiteBackground() {
  return (
    <div className="site-canvas" aria-hidden>
      <div className="site-aurora" />
      <span className="site-blob site-blob-a" />
      <span className="site-blob site-blob-b" />
    </div>
  );
}
