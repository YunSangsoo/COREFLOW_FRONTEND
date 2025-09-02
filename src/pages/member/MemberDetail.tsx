import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import styles from './MemberDetail.module.css';
import { memberDetail, memberUpdate, posList } from '../../features/memberService';
import type { MemberDetail, MemberPatch, Position } from '../../types/member';
import React, { useEffect, useState } from 'react';

export default function MemberDetail({userNo, onClose}:{userNo:number, onClose:()=> void}) {
    const queryClient = useQueryClient();

    // 초기 데이터용 훅
    const {data, isLoading, isError, error} = useQuery<MemberDetail>({
        queryKey : ['memberDetail',userNo],
        queryFn : () => memberDetail(userNo)
    });

    // 직위 조회용 훅
    const {data:position} = useQuery<Position[]>({
        queryKey:['positions'],
        queryFn:posList
    })

    // 수정할 데이터용 훅
    const [updateData, setUpdateData] = useState<MemberPatch|undefined>(data);

    // 부서 목록 조회용 훅
    const [isDepartmentMap, setIsDepartment] = useState(false);

    useEffect(() => {
        setUpdateData(data)
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

    // 입력 필드 수정 핸들러
    const handleChange = (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
        const {name,value} = e.target;
        setUpdateData(prev => ({...(prev||{}),[name]:value}));
    }

    // 부서 선택 핸들러 (DepartmentMap에서부터 받아올 예정)
    const handleDepSelect = (depName:string) => {
        setUpdateData
    }











    // 수정 버튼
    const handleUpdate = () => {
        if(updateData){
            updateMutation.mutate(updateData);
        }
    }

    if(isLoading) return <div>Loading...</div>
    if(isError) return <div>{error.message}</div>
    if(!data || !updateData) return <div>사원 정보를 찾을 수 없습니다.</div>

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
                        <span>사원번호</span>
                        <input type="text" name='userNo' value={data.userNo} readOnly/>
                    </div>
                    <div className={styles.infoRow}>
                        <span>입사일</span>
                        <input type="text" name='hireDate' value={updateData.hireDate} onChange={handleChange}/>
                    </div>
                    <div className={styles.infoRow}>
                        <span>사원명</span>
                        <input type="text" name='userName' value={updateData.userName} onChange={handleChange}/>
                    </div>
                    <div className={styles.infoRow}>
                        <span>소속</span>
                        <input type="text" name='depName' value={updateData.depName} onChange={handleChange}/>
                    </div>
                    <div className={styles.infoRow}>
                        <span>이메일</span>
                        <input type="text" name='email' value={updateData.email} onChange={handleChange}/>
                    </div>
                    <div className={styles.infoRow}>
                        <span>직위</span>
                        <select name="posName" value={updateData.posName} onChange={handleChange}>
                            {position?.map(pos => (
                                <option key={pos.posId} value={pos.posId}>
                                    {pos.posName}
                                </option>
                            ))}
                        </select>
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
