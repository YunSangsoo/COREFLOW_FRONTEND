import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import styles from './MemberDetail.module.css';
import { memberDelete, memberDetail, memberUpdate, posList } from '../../api/memberApi';
import type { MemberDetail, MemberPatch, MemberResponse, Position } from '../../types/member';
import React, { useEffect, useRef, useState } from 'react';
import DepartmentMap from './DepartmentMap';

export default function MemberDetail({ userNo, onClose }: { userNo: number, onClose: () => void }) {
    const queryClient = useQueryClient();

    // 프로필사진용 훅
    const [profileImg, setProfileImg] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    // 초기 데이터용 훅
    const { data, isLoading, isError, error } = useQuery<MemberDetail>({
        queryKey: ['memberDetail', userNo],
        queryFn: () => memberDetail(userNo)
    });

    // 직위 조회용 훅
    const { data: position } = useQuery<Position[]>({
        queryKey: ['positions'],
        queryFn: posList
    })

    // 수정할 데이터용 훅
    const [updateData, setUpdateData] = useState<MemberPatch | null>(null);

    // departmentMap 컴포넌트 렌더링(부서 목록 조회용 훅)
    const [isDepartmentMap, setIsDepartment] = useState(false);

    // 외부 클릭시 departmentMap 컴포넌트 닫기기능(지피티 help)
    const depMapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (depMapRef.current && !depMapRef.current.contains(event.target as Node)) {
                setIsDepartment(false);
            }
        };

        if (isDepartmentMap) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isDepartmentMap]);

    useEffect(() => {
        if (data) {
            setUpdateData(data)
        }
    }, [data]);

    // 프로필사진 핸들러
    const handleChangeProfile = (e:React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setProfileImg(file);

        if(file){
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }else{
            setPreview(null);
        }
    }

    // 사원 데이터 수정
    const updateMutation = useMutation({
        mutationFn: (updatedMember: FormData) => memberUpdate(userNo, updatedMember), //MemberPatch
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            queryClient.invalidateQueries({ queryKey: ['memberDetail', userNo] });
            alert("회원 정보 수정 완료");
            onClose();
        },
        onError: () => {alert("회원 정보 수정 실패");}
    });

    const deleteMutation = useMutation({
        mutationFn: (userNo: number) => memberDelete(userNo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            alert('사원 삭제 완료');
            onClose();
        },
        onError: () => {alert('사원 삭제 실패');}
    })

    // 입력 필드 수정 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUpdateData(prev => ({ ...(prev || {}), [name]: value }));
    }

    // 부서 선택창 핸들러
    const handleDepOpen = () => {
        setIsDepartment(prev => !prev)
    }

    // 부서 선택 데이터 (DepartmentMap에서부터 받아올 예정)
    const handleDepSelect = (depName: string) => {
        setUpdateData(prev => ({ ...(prev || {}), depName }));
        setIsDepartment(false)
    }
    
    // 주소 검색 핸들러
    const handleSearchAddress = () => {
        new window.daum.Postcode({
            oncomplete:(data:any) => {
                setUpdateData(prev => ({
                    ...prev,
                    address:data.address,
                    addressDetail:data.buildingName || ''
                }))
            }
        }).open();
    }

    // 사원 정보 수정 버튼 (GPT HELP)
    const handleUpdate = () => {
        if (!data || !updateData) {
            alert("수정사항이 없습니다.");
            return;
        };

        const formData = new FormData();
        formData.append('memberdata', new Blob([JSON.stringify(updateData)], { type: 'application/json' }));
        if(profileImg){
            formData.append('profile',profileImg);
        }
        updateMutation.mutate(formData);
    }

    // 사원 삭제 버튼
    const handleDelete = () => {
        if (window.confirm('정말로 삭제하시겠습니까?')) {
            deleteMutation.mutate(userNo);
        }
    }

    const originalImageUrl = `${import.meta.env.VITE_API_BASE_URL}/images/${data?.profile.imageCode}/${data?.profile.changeName}`;
    
    // 날짜 포맷
    const hireDateFormat = updateData?.hireDate?.split('T')[0];
    const updateDateFormat = updateData?.updateDate?.split('T')[0];

    if (isLoading) return <div>Loading...</div>
    if (isError) return <div>{error.message}</div>
    if (!data || !updateData) return <div>사원 정보를 찾을 수 없습니다.</div>

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2 className="text-xl font-semibold mb-4">사원 상세 조회</h2>
                <div className={styles.profileSection}>
                    <div className={styles.profileImage}>
                        <img src={preview || originalImageUrl} alt="Profile" />
                        <label htmlFor="profile-image-upload" className={styles.plusIcon}>+</label>
                        <input id="profile-image-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChangeProfile} />
                    </div>
                </div>

                <div className={styles.infoGrid}>
                    <div className={styles.infoRow}>
                        <span>사원번호</span>
                        <input type="text" name='userNo' value={data.userNo} readOnly />
                    </div>
                    <div className={styles.infoRow}>
                        <span>입사일</span>
                        <input type="text" name='hireDate' value={hireDateFormat} onChange={handleChange} />
                    </div>
                    <div className={styles.infoRow}>
                        <span>사원명</span>
                        <input type="text" name='userName' value={updateData.userName} onChange={handleChange} />
                    </div>
                    <div className={styles.infoRow}>
                        <span>소속</span>
                        <div className={styles.depInputContainer} ref={depMapRef}>
                            <input type="text" name='depName' value={updateData.depName || ''} onClick={handleDepOpen} readOnly />
                            {isDepartmentMap && (
                                <div className={styles.depTreeContainer}>
                                    <DepartmentMap departmentSelect={handleDepSelect} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.infoRow}>
                        <span>이메일</span>
                        <input type="text" name='email' value={updateData.email} onChange={handleChange} />
                    </div>
                    <div className={styles.infoRow}>
                        <span>직위</span>
                        <select name="posName" value={updateData.posName || ''} onChange={handleChange}>
                            {position?.map(pos => (
                                <option key={pos.posId} value={pos.posName}>
                                    {pos.posName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.infoRow}>
                        <span>전화번호</span>
                        <input type="text" name='phone' value={updateData.phone || ''} onChange={handleChange} />
                    </div>
                    <div className={styles.infoRow}>
                        <span>내선번호</span>
                        <input type="text" name='extension' value={updateData.extension || ''} onChange={handleChange} />
                    </div>
                    <div className={styles.infoRow}>
                        <span>재직상태</span>
                        <select name="status" value={updateData.status || ''} onChange={handleChange}>
                            <option value="T">재직</option>
                            <option value="F">퇴직</option>
                        </select>
                    </div>
                    <div className={styles.infoRow}>
                        <span>수정일</span>
                        <input type="text" name='updateDate' value={updateDateFormat} readOnly />
                    </div>
                </div>

                <div className={styles.addressSection}>
                    <div className={styles.addressRow}>
                        <span>주소</span>
                        <input type="text" name='address' value={updateData.address || ''} onChange={handleChange} />
                        <button className={styles.addressButton} onClick={handleSearchAddress}>주소찾기</button>
                    </div>
                    <div className={styles.addressRow}>
                        <span>상세주소</span>
                        <input type="text" name='addressDetail' value={updateData.addressDetail || ''} onChange={handleChange} />
                    </div>
                </div>

                <div className={styles.buttonGroup}>
                    <button onClick={onClose}>닫기</button>
                    <button onClick={handleUpdate}>수정</button>
                    <button onClick={handleDelete}>삭제</button>
                </div>
            </div>
        </div>
    );
}
