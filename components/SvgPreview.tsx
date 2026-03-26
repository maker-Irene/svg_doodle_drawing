/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef } from 'react';
import { Download, CheckCircle2, Code } from 'lucide-react';
import { GeneratedSvg } from '../types';

interface SvgPreviewProps {
  data: GeneratedSvg | null;
}

export const SvgPreview: React.FC<SvgPreviewProps> = ({ data }) => {
  const [copied, setCopied] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset copied state when data changes
  useEffect(() => {
    setCopied(false);
  }, [data]);

  if (!data) return null;

  const handleDownload = () => {
    const blob = new Blob([data.content], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vectorcraft-${data.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-zinc-50">
          <h3 className="text-lg font-bold text-zinc-900 truncate max-w-[150px] sm:max-w-xs">
            결과: <span className="text-zinc-600">"{data.prompt}"</span>
          </h3>
          <div className="flex gap-3">
            <button
              onClick={handleCopyCode}
              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border-2 border-transparent hover:border-black"
              title="SVG 코드 복사"
            >
              {copied ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <Code className="w-6 h-6" />}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-black rounded-lg hover:bg-zinc-800 transition-colors border-2 border-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">다운로드</span>
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="p-12 flex items-center justify-center bg-white min-h-[400px]">
          <div 
            ref={containerRef}
            className="w-full max-w-[512px] h-auto transition-all duration-500 transform hover:scale-[1.02]"
            dangerouslySetInnerHTML={{ __html: data.content }} 
          />
        </div>
        
        {/* Metadata Footer */}
        <div className="px-6 py-3 bg-zinc-50 border-t-4 border-black flex justify-between text-xs font-bold text-zinc-500">
          <span>Gemini 3 Pro로 생성됨</span>
        </div>
      </div>
    </div>
  );
};
