import { useState, type ChangeEvent, type HTMLInputTypeAttribute, type InputHTMLAttributes, type ReactNode } from "react";

//
// 1. 검색 폼
//
export interface SearchFormProps {
  values: {
    userName: string;
    parentDepId: number | null;
    childDepId: number | null;
    posName: string;
  };
  parentDep?: { depId: number; depName: string }[];
  childDep?: { depId: number; depName: string }[];
  position?: { posId: number; posName: string }[];
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function MemberSearchForm({
  values,
  parentDep,
  childDep,
  position,
  onChange,
}: SearchFormProps) {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
      <span>
        사원명
        <input
          type="text"
          placeholder="사원명 검색"
          name="userName"
          value={values.userName}
          onChange={onChange}
          className="ml-2 p-1 border rounded"
        />
      </span>
      <span>
        부서
        <select
          name="parentDepId"
          value={values.parentDepId || ""}
          onChange={onChange}
          className="ml-2 p-1 border rounded"
        >
          <option value="">전체</option>
          {parentDep?.map((dep) => (
            <option key={dep.depId} value={dep.depId}>
              {dep.depName}
            </option>
          ))}
        </select>
      </span>
      <span>
        상세 부서
        <select
          name="childDepId"
          value={values.childDepId || ""}
          onChange={onChange}
          disabled={!values.parentDepId}
          className="ml-2 p-1 border rounded"
        >
          <option value="">전체</option>
          {childDep?.map((dep) => (
            <option key={dep.depId} value={dep.depId}>
              {dep.depName}
            </option>
          ))}
        </select>
      </span>
      <span>
        직위
        <select
          name="posName"
          value={values.posName}
          onChange={onChange}
          className="ml-2 p-1 border rounded"
        >
          <option value="">전체</option>
          {position?.map((pos) => (
            <option key={pos.posId} value={pos.posName}>
              {pos.posName}
            </option>
          ))}
        </select>
      </span>
    </div>
  );
}

export interface MemberControllProps {
  title: string;
  value?: string;
  readOnly?: boolean;
  type?: HTMLInputTypeAttribute;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  renderAction?: ReactNode;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, 
    "value" | "onChange" | "type" | "readOnly">;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  actionClassName?: string;
}

export function MemberControll({
  title,
  value,
  readOnly = false,
  type = "text",
  onChange,
  renderAction,
  inputProps,
  className = "",
  labelClassName = "",
  inputClassName = "",
  actionClassName = "",
}: MemberControllProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if(type === "file" && e.target.files?.[0]){
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    onChange?.(e);
  };

  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <label className={`w-24 font-medium ${labelClassName}`}>{title}</label>
      <div className="flex-1 flex items-center gap-2">
        <input
          type={type}
          {...(type !== "file" ? {value} : {})}
          onChange={handleChange}
          readOnly={readOnly}
          className={`w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${readOnly ? "bg-gray-100" : ""} ${inputClassName}`}
          {...inputProps}
        />

        {/* 파일 미리보기 기능 */}
        {type === "file" && preview && (
          <img
            src={preview}
            alt="미리보기"
            className="w-24 h-24 object-cover border"
          >
          </img>
        )}
      </div>
      {renderAction && (
        <div className={`shrink-0 ${actionClassName}`}>
          {renderAction}
        </div>
      )}
    </div>
  );
}

//
// 2. 액션 버튼 묶음
//
export interface MemberActionsProps {
  onReset: () => void;
  onSearch: () => void;
  onRegister?: () => void;
}

export function MemberActions({ onReset, onSearch, onRegister }: MemberActionsProps) {
  return (
    <div className="flex gap-2 p-2">
      <button
        onClick={onReset}
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
      >
        초기화
      </button>
      <button
        onClick={onSearch}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        검색
      </button>
      {onRegister && (
        <button
          onClick={onRegister}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          사원등록
        </button>
      )}
    </div>
  );
}

//
// 3. 공통 테이블
//
export interface Column<T> {
  key: keyof T;
  label: string;
}

interface CommonTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowDoubleClick?: (row: T) => void;
}

export function CommonTable<T extends { [key: string]: any }>({
  columns,
  data,
  onRowDoubleClick,
}: CommonTableProps<T>) {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full border-collapse">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="px-3 py-2 text-left border-b">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, idx) => (
              <tr
                key={idx}
                onDoubleClick={() => onRowDoubleClick?.(row)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-3 py-2 border-b">
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-3 py-2 text-center">
                데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

//
// 4. 모달 Wrapper
//
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 relative min-w-[400px]">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
