import React from 'react';
import { EngWordAnalysisResultView } from './EngWordAnalysisResult.tsx';
import { ViToEngAnalysisResultView } from './ViToEngAnalysisResult.tsx';

interface Props {
  data: any;
  mode?: string;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export const AnalysisResult: React.FC<Props> = (props) => {
  if (props.mode === 'vi-to-eng' || props.mode === 'vi-to-pali') {
    return <ViToEngAnalysisResultView {...props} />;
  }
  return <EngWordAnalysisResultView {...props} />;
};
