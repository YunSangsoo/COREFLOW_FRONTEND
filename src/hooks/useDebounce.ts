import { useEffect, useState } from 'react';

// <T>는 제네릭(Generic)으로, 어떤 타입의 값이든 받을 수 있게 해줍니다. (문자열, 숫자 등)
export function useDebounce<T>(value: T, delay = 500): T {
  // 디바운스된 값을 저장할 state
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // value가 바뀔 때마다 타이머를 설정합니다.
    const handler = setTimeout(() => {
      // delay 시간이 지나면 (예: 500ms), 최신 value를 debouncedValue state에 저장합니다.
      setDebouncedValue(value);
    }, delay);

    // useEffect의 cleanup 함수:
    // value나 delay가 바뀌면(사용자가 새 글자를 입력하면) 이전 타이머는 취소하고,
    // 새로운 타이머를 다시 설정합니다.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // value 또는 delay가 변경될 때마다 이 effect를 재실행합니다.

  // 최종적으로 디바운스된 값을 반환합니다.
  return debouncedValue;
}