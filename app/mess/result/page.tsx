import React, { Suspense } from 'react';
import ResultContent from './ResultContent';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResultContent />
    </Suspense>
  );
}
