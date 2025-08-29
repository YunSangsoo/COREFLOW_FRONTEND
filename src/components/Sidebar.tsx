import { useState } from 'react';
import styles from './Sidebar.module.css'

export default function Sidebar(){
    const [open, setOpen] = useState(false);
    
    return (
        <div className={styles.sidebar}>
            <div className={styles.home}>홈</div>
            <ul onClick={() => setOpen(!open)}>인사관리
                {
                    open && (
                        <ul>
                            <li>사원관리</li>
                            <li>연차관리</li>
                            <li>근태관리</li>
                            <li>조직도</li>
                        </ul>
                    )
                }
            </ul>
        </div>
    )
}