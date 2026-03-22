import { Session } from "next-auth";

export interface ManikuttiSession extends Session {
  accessToken?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
  };
}

export interface Expense {
  date: string;
  amount: number;
  category: string;
  note: string;
  status: string;
  index: number;
}
