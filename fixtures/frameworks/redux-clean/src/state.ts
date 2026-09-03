type State = { count: number };
type Action = { type: "increment" } | { type: "reset" };
export const reducer = (state: State, action: Action): State => {
  if (action.type === "increment") return { ...state, count: state.count + 1 };
  return { count: 0 };
};
export const selectCount = (state: State) => state.count;
