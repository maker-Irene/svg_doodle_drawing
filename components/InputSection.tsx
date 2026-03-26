/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { Send, Loader2, Wand2, Zap, Sparkles } from 'lucide-react';
import { GenerationStatus, GenerationQuality } from '../types';

interface InputSectionProps {
  onGenerate: (prompt: string) => void;
  status: GenerationStatus;
  quality: GenerationQuality;
  onQualityChange: (quality: GenerationQuality) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  onGenerate, 
  status, 
  quality, 
  onQualityChange 
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status !== GenerationStatus.LOADING) {
      onGenerate(input.trim());
    }
  }, [input, status, onGenerate]);

  const isLoading = status === GenerationStatus.LOADING;

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-zinc-900 mb-3">
          무엇을 그리고 싶으신가요?
        </h2>
        <p className="text-zinc-600 text-lg">
          사물, 아이콘 또는 장면을 설명하면 벡터 아트로 그려드립니다.
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => onQualityChange(GenerationQuality.FAST)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all border-2 border-black
            ${quality === GenerationQuality.FAST 
              ? 'bg-yellow-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
              : 'bg-white text-zinc-500 opacity-60 hover:opacity-100'}
          `}
          disabled={isLoading}
        >
          <Zap className="w-4 h-4" />
          빠른 생성
        </button>
        <button
          onClick={() => onQualityChange(GenerationQuality.HIGH)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all border-2 border-black
            ${quality === GenerationQuality.HIGH 
              ? 'bg-indigo-400 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
              : 'bg-white text-zinc-500 opacity-60 hover:opacity-100'}
          `}
          disabled={isLoading}
        >
          <Sparkles className="w-4 h-4" />
          고품질 생성
        </button>
      </div>

      <form onSubmit={handleSubmit} className="relative group">
        <div 
          className="relative flex items-center bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden p-2"
          style={{ borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px' }}
        >
          <div className="pl-4 text-zinc-400">
            <Wand2 className="w-6 h-6" />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 네온 사인이 있는 미래형 사이버펑크 헬멧..."
            className="flex-1 bg-transparent border-none outline-none text-zinc-900 placeholder-zinc-400 px-4 py-3 text-xl font-bold"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`
              flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-bold transition-all duration-200 border-2 border-black
              ${!input.trim() || isLoading 
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' 
                : 'bg-black text-white hover:bg-zinc-800 active:scale-95 active:translate-x-1 active:translate-y-1 active:shadow-none'}
            `}
            style={{ borderRadius: '15px 225px 15px 255px/255px 15px 225px 15px' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="hidden sm:inline text-lg">제작 중...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline text-lg">생성하기</span>
                <Send className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Quick suggestions */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {[
          { label: '레트로 카메라', value: 'Retro Camera' },
          { label: '우주 로켓', value: 'Space Rocket' },
          { label: '종이접기 새', value: 'Origami Bird' },
          { label: '아이소메트릭 하우스', value: 'Isometric House' }
        ].map((suggestion) => (
          <button
            key={suggestion.value}
            onClick={() => setInput(suggestion.value)}
            className="px-4 py-2 text-sm font-bold text-zinc-700 bg-white border-2 border-black rounded-full hover:bg-zinc-100 hover:text-zinc-900 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            disabled={isLoading}
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
};
