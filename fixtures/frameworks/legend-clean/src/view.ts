declare const store$: { profile: { name: unknown } };
declare function useValue<T>(value: T): T;
export const useProfileName = () => useValue(store$.profile.name);
