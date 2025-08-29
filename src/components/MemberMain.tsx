import { useState, type ChangeEvent } from "react"
import styles from './MemberMain.module.css'

export default function MemberMain() {
    // 부서 select box
    const [selectDept, setSelectDept] = useState("전체");
    // 직위 select box
    const [selectPosi, setSelectPosi] = useState("전체");

    const deptOption = [
        {value:1, label:'ㅇㅇ과'},
        {value:2, label:'ㅇㅇ과'},
        {value:3, label:'ㅇㅇ과'}
    ];

    const posiOption = [
        {value:1, label:'부장'},
        {value:2, label:'차장'},
        {value:3, label:'과장'}
    ];
    
    const deptHandleChange = (e:ChangeEvent<HTMLSelectElement>) => {
        setSelectDept(e.target.value);
    }
    const posiHandleChange = (e:ChangeEvent<HTMLSelectElement>) => {
        setSelectPosi(e.target.value);
    }
    return(
        <>
        <div className={styles.container}>
            <h1>사원관리</h1>
            <div className={styles.searchSection}>
                <span>사원명<input type="text" placeholder="사원명 검색"/></span>
                <span>부서
                    <select value={selectDept} onChange={deptHandleChange}>
                        <option value="all">전체</option>
                        {
                            deptOption.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))
                        }
                    </select>
                </span>
                <span>직위
                    <select value={selectPosi} onChange={posiHandleChange}>
                        <option value="all">전체</option>
                        {
                            posiOption.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))
                        }
                    </select>
                </span>
            </div>
            <div className={styles.buttonSection}>
                <button>초기화</button>
                <button>검색</button>
                <button>사원등록</button>
            </div>
            <div className={styles.tableSection}>
                <table>
                    <thead>
                        <tr>
                            <th>NO</th>
                            <th>사원번호</th>
                            <th>사원명</th>
                            <th>이메일</th>
                            <th>입사일</th>
                            <th>부서</th>
                            <th>직위</th>
                            <th>전화번호</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>20250000</td>
                            <td>밍경밍</td>
                            <td>rudald@naver.com</td>
                            <td>2025-01-01</td>
                            <td>인사과</td>
                            <td>부장</td>
                            <td>010-1234-5678</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        </>
    )
}