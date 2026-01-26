export interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: "ADMIN" | "MANAGER";
}
