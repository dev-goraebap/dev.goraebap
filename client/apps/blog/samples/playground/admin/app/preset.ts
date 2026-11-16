import { createContext, useContext } from 'react';

/** 견본이 조작 없이 보이고 싶은 화면 상태(고른 사용자, 바꾼 권한 칸). 이 앱의 화면 상태는 주소가 아니라 메모리에 있다. */
export type Preset = { selectedUsers?: string[]; changedCells?: string[]; permissionRole?: string };
export const PresetContext = createContext<Preset>({});
export const usePreset = () => useContext(PresetContext);
