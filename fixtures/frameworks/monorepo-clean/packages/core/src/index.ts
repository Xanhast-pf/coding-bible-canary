export type User = { id: string; name: string };
export const getDisplayName = (user: User) => user.name;
