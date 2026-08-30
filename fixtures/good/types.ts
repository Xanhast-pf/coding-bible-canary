export interface User {
  id: string;
  name: string;
  active: boolean;
  address?: {
    city?: string;
  };
}
