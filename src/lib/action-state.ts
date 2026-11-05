export type ActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Valores a repopular (nunca senhas). */
  values?: Record<string, string>;
};

export const initialState: ActionState = {};
