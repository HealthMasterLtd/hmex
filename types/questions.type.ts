// types/questions.type.ts
import React from 'react';

export interface Answers {
  [key: string]: string | number | boolean;
}

// FIXED: Remove the index signature or make it more flexible
export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  image?: string;
  examples?: string[];
  icon?: React.ReactNode;
}

export interface InputField {
  label: string;
  unit: string;
  placeholder: string;
}

export interface DisplayQuestion {
  id: string;
  type: string;
  category: string;
  stepOf: string;
  icon: React.ReactNode;
  question: string;
  subtitle: string;
  progress: number;
  hasImages?: boolean;
  hasInput?: boolean;
  hasDoubleInput?: boolean;
  inputLabel?: string;
  inputUnit?: string;
  inputPlaceholder?: string;
  note?: string;
  options?: QuestionOption[];
  inputs?: InputField[];
  min?: number;
  max?: number;
  unit?: string;
  required: boolean;
  aiGenerated: boolean;
  tooltip?: string;
}