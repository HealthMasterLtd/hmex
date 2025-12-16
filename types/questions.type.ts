// Type definitions
export interface BaseOption {
  label: string;
  value: string;
  description?: string;
}

export interface InputField {
  label: string;
  placeholder: string;
  unit: string;
}

export interface BaseQuestion {
  step: number;
  category: string;
  stepOf: string;
  progress: number;
  icon: string;
  question: string;
  subtitle: string;
  type: string;
  note?: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  options: BaseOption[];
  hasInput?: false;
  hasDoubleInput?: false;
  hasImages?: false;
}

export interface SingleInputQuestion extends BaseQuestion {
  hasInput: true;
  inputPlaceholder: string;
  inputLabel: string;
  inputUnit: string;
  options?: BaseOption[];
  hasDoubleInput?: false;
  hasImages?: false;
}

export interface DoubleInputQuestion extends BaseQuestion {
  hasDoubleInput: true;
  inputs: InputField[];
  hasInput?: false;
  options?: never;
  hasImages?: false;
}

export interface ImageOptionsQuestion extends BaseQuestion {
  hasImages: true;
  options: Array<BaseOption & { image: string; examples: string[] }>;
  hasInput?: false;
  hasDoubleInput?: false;
}

export type Question =
  | MultipleChoiceQuestion
  | SingleInputQuestion
  | DoubleInputQuestion
  | ImageOptionsQuestion;

export interface Answers {
  [key: string]: string;
}
