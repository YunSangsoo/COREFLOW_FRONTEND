import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import styles from './MemberDetail.module.css';
import { memberDetail, memberUpdate } from '../../features/memberService';
import type { MemberDetail, MemberPatch } from '../../types/member';
import React, { useEffect, useState, type ChangeEvent } from 'react';

export default function MemberDetail({userNo, onClose}:{userNo:number, onClose:()=> void}) {
    const queryClient = useQueryClient();

    // 초기 데이터용 훅
    const {data, isLoading, isError, error} = useQuery<MemberDetail>({
        queryKey : ['memberDetail',userNo],
        queryFn : () => memberDetail(userNo)
    });

    // 수정할 데이터용 훅
    const [updateData, setUpdateData] = useState<MemberPatch|null>(null);

    useEffect(() => {
        setUpdateData({...data})
    },[data]);

    // 사원 데이터 수정
    const updateMutation = useMutation({
        mutationFn:(updatedMember:MemberPatch) => memberUpdate(userNo,updatedMember),
        onSuccess:() => {
            queryClient.invalidateQueries({queryKey:['members']});
            queryClient.invalidateQueries({queryKey:['memberDetail',userNo]});
            alert("회원 정보 수정 완료");
            // onClose();
        },
        onError:() => {
            alert("회원 정보 수정 실패");
        }
    });

    // input태그 수정
    const handleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        const {name,value} = e.target;
        setUpdateData(prev => prev ? {...prev,[name]:value} : null)
    }

    // 수정 버튼
    const handleUpdate = () => {
        if(updateData){
            updateMutation.mutate(updateData);
        }
    }

    if(isLoading) return <div>Loading...</div>
    if(isError) return <div>{error.message}</div>
    if(!data || !updateData) return <div>해당 사원 정보를 찾을 수 없습니다.</div>

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.profileSection}>
                    <div className={styles.profileImage}>
                        <img src="/path/to/profile/image.jpg" alt="Profile" />
                        <button className={styles.plusIcon}>+</button>
                    </div>
                </div>

                <div className={styles.infoGrid}>
                    <div className={styles.infoRow}>
                        <span>사원명</span>
                        <input type="text" name='userName' value={updateData.userName} onChange={handleChange}/>
                    </div>
                    <div className={styles.infoRow}>
                        <span>입사일</span>
                        <input type="text" name='hireDate' value={updateData.hireDate} onChange={handleChange}/>
                    </div>
                    <div className={styles.infoRow}>
                        <span>사원번호</span>
                        <input type="text" name='userNo' value={data.userNo} readOnly/>
                    </div>
                    <div className={styles.infoRow}>
                        <span>부서</span>
                        <input type="text" name='depName' value={updateData.depName} onChange={handleChange}/>
                    </div>
                    <div className={styles.infoRow}>
                        <span>이메일</span>
                        <input type="text" name='email' value={updateData.email} onChange={handleChange}/>
                    </div>
                    <div className={styles.infoRow}>
                        <span>직위</span>
                        <input type="text" name='posName' value={updateData.posName} onChange={handleChange}/>
                    </div>
                    <div className={styles.infoRow}>
                        <span>전화번호</span>
                        <input type="text" name='phone' value={updateData.phone} onChange={handleChange}/>
                    </div>
                    <div className={styles.infoRow}>
                        <span>내선번호</span>
                        <input type="text" name='extention' value={updateData.extention} onChange={handleChange}/>
                    </div>
                    <div className={styles.infoRow}>
                        <span>수정일</span>
                        <input type="text" name='updateDate' value={data.updateDate} readOnly/>
                    </div>
                </div>
                
                <div className={styles.addressSection}>
                    <div className={styles.addressRow}>
                        <span>주소</span>
                        <input type="text" name='address' value={updateData.address} onChange={handleChange}/>
                        <button className={styles.addressButton}>주소찾기</button>
                    </div>
                    <div className={styles.addressRow}>
                        <span>상세주소</span>
                        <input type="text" name='addressDetail' value={updateData.addressDetail} onChange={handleChange}/>
                    </div>
                </div>
                
                <div className={styles.buttonGroup}>
                    <button onClick={onClose}>닫기</button>
                    <button onClick={handleUpdate}>수정</button>
                </div>
            </div>
        </div>
    );
}

// // src/pages/MemberDetail.tsx

// import styles from './MemberDetail.module.css';
// import { useQuery } from '@tanstack/react-query';
// import type { MemberDetail} from '../../types/member';

// // 🔥 상세 사원 정보를 위한 임시 데이터 (컴포넌트 외부에 정의)
// const mockMemberDetails: MemberDetail[] = [
//     {
//         userNo: 1,
//         userName: '김민준',
//         email: 'kmj@test.com',
//         hireDate: '2022-01-15',
//         depName: '영업팀',
//         posName: '사원',
//         phone: '010-1234-5678',
//         extention: 1234,
//         updateDate: '2024-04-20',
//         address: '서울시 강남구 테헤란로 123',
//         addressDetail: '101호'
//     },
//     {
//         userNo: 2,
//         userName: '박서연',
//         email: 'psy@test.com',
//         hireDate: '2021-05-20',
//         depName: '개발팀',
//         posName: '대리',
//         phone: '010-9876-5432',
//         extention: 5678,
//         updateDate: '2024-03-15',
//         address: '경기도 성남시 분당구 판교역로 456',
//         addressDetail: 'B동 202호'
//     },
//     {
//         userNo: 3,
//         userName: '이도윤',
//         email: 'ldy@test.com',
//         hireDate: '2023-03-10',
//         depName: '인사팀',
//         posName: '사원',
//         phone: '010-1111-2222',
//         extention: 3333,
//         updateDate: '2024-05-01',
//         address: '부산시 해운대구 마린시티1로 789',
//         addressDetail: 'C동 303호'
//     },
//     {
//         userNo: 4,
//         userName: '정수민',
//         email: 'jsm@test.com',
//         hireDate: '2020-08-01',
//         depName: '영업팀',
//         posName: '팀장',
//         phone: '010-3333-4444',
//         extention: 4444,
//         updateDate: '2024-02-10',
//         address: '대구시 중구 동성로 10',
//         addressDetail: '123번지'
//     },
//     {
//         userNo: 5,
//         userName: '최은지',
//         email: 'cej@test.com',
//         hireDate: '2023-11-25',
//         depName: '개발팀',
//         posName: '사원',
//         phone: '010-5555-6666',
//         extention: 6666,
//         updateDate: '2024-01-05',
//         address: '대전시 서구 둔산로 5',
//         addressDetail: '404호'
//     },
//     {
//         userNo: 6,
//         userName: '윤지훈',
//         email: 'yjh@test.com',
//         hireDate: '2022-09-05',
//         depName: '영업팀',
//         posName: '대리',
//         phone: '010-7777-8888',
//         extention: 8888,
//         updateDate: '2024-03-25',
//         address: '광주시 서구 상무대로 200',
//         addressDetail: '505호'
//     },
// ];

// // 🔥 상세 조회 API를 모킹하는 함수
// const mockMemberDetail = (userNo: number) => {
//     return new Promise<MemberDetail | undefined>(resolve => {
//         setTimeout(() => {
//             const member = mockMemberDetails.find(m => m.userNo === userNo);
//             resolve(member);
//         }, 300); // 0.3초의 지연시간을 둡니다.
//     });
// };

// interface MemberDetailProps {
//     userNo: number;
//     onClose: () => void;
// }

// export default function MemberDetail({ userNo, onClose}:{userNo:number, onClose:()=>void}) {
    
//     // TanStack Query를 사용하여 상세 데이터 가져오기
//     const { data, isLoading, isError, error } = useQuery({
//         // userNo가 변경되면 쿼리를 다시 실행합니다.
//         queryKey: ['memberDetail', userNo],
//         // mock 함수를 queryFn으로 사용합니다.
//         queryFn: () => mockMemberDetail(userNo),
//         // userNo가 유효한 값일 때만 쿼리를 실행합니다.
//         enabled: !!userNo,
//     });
   
//     if(isLoading) return <div>Loading...</div>
//     if(isError) return <div>{error.message}</div>
//     if(!data) return <div>해당 사원 정보를 찾을 수 없습니다.</div>

//     return (
//         <div className={styles.modalOverlay}>
//             <div className={styles.modalContent}>
                
//                 <div className={styles.profileSection}>
//                     <div className={styles.profileImage}>
//                         <img src="/path/to/profile/image.jpg" alt="Profile" />
//                         <button className={styles.plusIcon}>+</button>
//                     </div>
//                 </div>

//                 <div className={styles.infoGrid}>
//                     <div className={styles.infoRow}>
//                         <span>사원명</span>
//                         <input type="text" value={data.userName} />
//                     </div>
//                     <div className={styles.infoRow}>
//                         <span>입사일</span>
//                         <input type="text" value={data.hireDate} />
//                     </div>
//                     <div className={styles.infoRow}>
//                         <span>사원번호</span>
//                         <input type="text" value={data.userNo} />
//                     </div>
//                     <div className={styles.infoRow}>
//                         <span>부서</span>
//                         <input type="text" value={data.depName} />
//                     </div>
//                     <div className={styles.infoRow}>
//                         <span>이메일</span>
//                         <input type="text" value={data.email} />
//                     </div>
//                     <div className={styles.infoRow}>
//                         <span>직위</span>
//                         <input type="text" value={data.posName} />
//                     </div>
//                     <div className={styles.infoRow}>
//                         <span>전화번호</span>
//                         <input type="text" value={data.phone} />
//                     </div>
//                     <div className={styles.infoRow}>
//                         <span>내선번호</span>
//                         <input type="text" value={data.extention} />
//                     </div>
//                     <div className={styles.infoRow}>
//                         <span>수정일</span>
//                         <input type="text" value={data.updateDate} />
//                     </div>
//                 </div>
                
//                 <div className={styles.addressSection}>
//                     <div className={styles.addressRow}>
//                         <span>주소</span>
//                         <input type="text" value={data.address} />
//                         <button className={styles.addressButton}>주소찾기</button>
//                     </div>
//                     <div className={styles.addressRow}>
//                         <span>상세주소</span>
//                         <input type="text" value={data.addressDetail} />
//                     </div>
//                 </div>
                
//                 <div className={styles.buttonGroup}>
//                     <button onClick={onClose}>닫기</button>
//                     <button>수정</button>
//                 </div>
//             </div>
//         </div>
//     );
// }