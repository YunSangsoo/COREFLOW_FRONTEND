// 메뉴 타입 정의
export interface Menu {
    id: number,
    restaurant: string,
    name: string,
    price: number,
    type: "kr" | "ch" | "jp" | "all",
    taste: "hot" | "mild" | "all"
}

export type MenuCreate = Omit<Menu, "id">;

export const initMenu:Menu = {
    id: 0,
    restaurant: "",
    name: "",
    price: 0,
    type: "all",
    taste: "all"
};

// 메뉴 수정 타입
export type MenuUpdate = Required<Pick<Menu, "id">> & Partial<Omit<Menu, "id">>;