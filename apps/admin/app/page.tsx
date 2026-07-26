import React from 'react';
import { SITE_NAME } from '@studioflow/shared';
import type { JsonValue } from '@studioflow/types';

// JsonValue used to prove cross-package type import resolves (T018)
const _typeCheck: JsonValue = { name: SITE_NAME };
void _typeCheck;

export default function AdminHome() {
  return (
    <main>
      <h1>{SITE_NAME} Admin</h1>
    </main>
  );
}
