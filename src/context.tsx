import { createContext, useContext } from "react";
import type { State, Role, Page, EntityKind } from "./domain";
import type { Access, AreaId } from "./access";
import type { RecordFilters } from "./records";

export interface CRMContext {
  filters: RecordFilters;
  setFilters: (value: RecordFilters) => void;
  state: State;
  rawState: State;
  access: Access;
  page: Page;
  area: AreaId;
  ownerNames: string[];
  can: Access["can"];
  manager: (role?: Role) => boolean;
  visible: (role: Role, actor: string, owner: string) => boolean;
  editable: (role: Role, actor: string, owner: string) => boolean;
  projectView: (
    project: State["projects"][number],
    role: Role,
    actor: string,
  ) => State["projects"][number] | undefined;
  actor: string;
  role: Role;
  mobile: boolean;
  change: (
    action: string,
    target: string,
    update: (state: State) => State,
    sensitive?: boolean,
  ) => boolean;
  navigate: (page: Page) => void;
  edit: (
    kind: EntityKind,
    id?: string,
    preset?: Record<string, unknown>,
  ) => void;
  detail: (kind: EntityKind, id: string) => void;
  communicate: (customerId: string, projectId?: string) => void;
  setUserId: (id: string) => void;
}
export const Context = createContext<CRMContext>(null!);
export const useCRM = () => useContext(Context);
