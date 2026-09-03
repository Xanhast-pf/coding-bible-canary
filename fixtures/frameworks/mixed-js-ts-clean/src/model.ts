export interface User {
  id: string;
  name: string;
}
export const normalizeName = (user: User) => user.name.trim();
