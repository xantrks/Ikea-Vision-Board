/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full p-4 text-left border-b border-zinc-200 flex-shrink-0">
      <div className="flex items-center">
          <h1 className="text-3xl font-extrabold tracking-tight" style={{color: 'var(--ikea-blue)'}}>
            IKEA Room Planner
          </h1>
      </div>
      <p className="mt-1 text-md text-zinc-600">
        Select furniture, upload a photo of your room, and let our AI show you how it looks.
      </p>
    </header>
  );
};

export default Header;