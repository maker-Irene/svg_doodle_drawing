/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { PenTool, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-4 border-b-4 border-black bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <PenTool className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">두들 벡터 생성기</h1>
            <p className="text-sm text-zinc-600 font-bold flex items-center gap-1">
              Gemini 3 Pro 기반 <Sparkles className="w-4 h-4 text-amber-500" />
            </p>
          </div>
        </div>
        <a 
          href="https://ai.google.dev/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hidden sm:block text-lg font-bold text-zinc-600 hover:text-black transition-colors underline decoration-2 underline-offset-4"
        >
          문서
        </a>
      </div>
    </header>
  );
};