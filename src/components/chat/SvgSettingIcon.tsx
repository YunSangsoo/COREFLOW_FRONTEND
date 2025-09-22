import React from 'react';

// 아이콘 컴포넌트가 받을 props 타입을 정의합니다.
// React.SVGProps<SVGSVGElement>를 확장하여 모든 표준 SVG 속성을 포함합니다.
interface SettingsIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string; // 아이콘 크기를 조절할 prop
}

interface VideoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const SettingsIcon = ({ size = 24, className, ...rest }: SettingsIconProps) => {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      xmlSpace="preserve"
      width={size} // props로 받은 size를 적용
      height={size} // props로 받은 size를 적용
      className={className} // 외부에서 전달된 className 적용
      {...rest} // onClick 등 나머지 props들을 전달
    >
      <g>
        {/*
          SVG의 fill 속성을 "currentColor"로 설정하면,
          부모 요소의 CSS color 속성을 상속받아 색상이 변경됩니다.
          이렇게 하면 TailwindCSS나 일반 CSS로 색상 제어가 매우 쉬워집니다.
        */}
        <path
          fill="currentColor"
          d="M362.7,0C338.8,0,320,17.1,320,37.5v102.4c0,20.5,18.8,37.5,42.7,37.5
          c23.9,0,42.7-17.1,42.7-37.5V37.5C405.3,17.1,386.6,0,362.7,0z M0,70.8v35.8h298.7V70.8H0z M426.7,70.8v35.8H512V70.8H426.7z
          M149.3,170.7c-23.9,0-42.7,17.1-42.7,37.5v102.4c0,20.5,18.8,37.5,42.7,37.5s42.7-17.1,42.7-37.5V208.2
          C192,187.7,173.2,170.7,149.3,170.7z M0,241.5v35.8h85.3v-35.8H0z M213.3,241.5v35.8H512v-35.8H213.3z M362.7,334.5
          c-23.9,0-42.7,17.1-42.7,37.5v102.4c0,20.5,18.8,37.5,42.7,37.5c23.9,0,42.7-17.1,42.7-37.5V372.1
          C405.3,350.7,386.6,334.5,362.7,334.5z M0,405.3v35.8h298.7v-35.8H0z M426.7,405.3v35.8H512v-35.8H426.7z"
        />
      </g>
    </svg>
  );
};

export const VideoIcon = ({ size = 24, className, ...rest }: VideoIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor" // 부모의 text 색상을 따라감
      width={size}
      height={size}
      className={className}
      {...rest}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z"
      />
    </svg>
  );
};

export default SettingsIcon;