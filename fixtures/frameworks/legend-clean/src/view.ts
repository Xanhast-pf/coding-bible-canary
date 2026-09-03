declare const store$: { profile: { name: unknown } };
declare function useValue<T>(value: T): T;
export const readName = () => useValue(store$.profile.name);
