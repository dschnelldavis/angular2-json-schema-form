import { ActionReducer, Action } from '@ngrx/store';

export const LOAD_LAYOUT = 'LOAD_LAYOUT';
export const ADD = 'ADD';
export const REMOVE = 'REMOVE';

export const layoutReducer: ActionReducer<any[]> =
  (state: any[] = [], action: Action) => {

  switch (action.type) {

    case LOAD_LAYOUT:
      return action.payload;

    case ADD:
      return state.concat({ description: action.payload, isDone: false });

    case REMOVE:
      const prefix = state.slice(0, action.payload);
      return (action.payload === state.length - 1) ?
        prefix : prefix.concat(state.slice((action.payload - state.length) + 1));

    default:
      return state;
  }
};
