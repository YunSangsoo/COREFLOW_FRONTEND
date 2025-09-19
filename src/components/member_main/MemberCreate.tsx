import React, { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posList, memberCreate } from '../../api/memberApi';
import type { Position } from '../../types/member';
import DepartmentMap from './DepartmentMap';
import styles from './MemberDetail.module.css';

<script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>

export type CreateUser = {
    email: string;
    userName: string;
    depName?: string;
    posName?: string;
    hireDate: string;
    extension: string;
    phone?: string;
    address?: string;
    addressDetail?: string;
    status: 'T' | 'F';
};

interface MemberCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MemberCreate({ isOpen, onClose }: MemberCreateModalProps) {
    const queryClient = useQueryClient();

    const [newProfileFile, setNewProfileFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [createUser, setCreateUser] = useState<CreateUser>({
        email: '',
        userName: '',
        depName: '',
        posName: '',
        hireDate: new Date().toISOString().split('T')[0],
        extension: '',
        phone: '',
        address: '',
        addressDetail: '',
        status: 'T'
    });

    const [isDepartmentMap, setIsDepartmentMap] = useState(false);
    const depMapRef = useRef<HTMLDivElement>(null);

    const today = new Date().toISOString().split('T')[0];

    // 직위 조회
    const { data: positions } = useQuery<Position[]>({
        queryKey: ['positions'],
        queryFn: posList
    });

    // 부서 모달 외부 클릭시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (depMapRef.current && !depMapRef.current.contains(event.target as Node)) {
                setIsDepartmentMap(false);
            }
        };
        if (isDepartmentMap) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDepartmentMap]);

    // 입력 변경 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCreateUser(prev => ({ ...prev, [name]: value }));
    };

    // 부서 선택
    const handleDepSelect = (depName: string) => {
        setCreateUser(prev => ({ ...prev, depName }));
        setIsDepartmentMap(false);
    };

    const handleDepOpen = () => setIsDepartmentMap(true);

    // 주소 검색
    const handleSearchAddress = () => {
        new window.daum.Postcode({
            oncomplete: (data: any) => {
                setCreateUser(prev => ({
                    ...prev,
                    address: data.address,                     // 도로명/지번
                    addressDetail: data.buildingName || ''    // 건물명 등 상세주소
                }));
            },
        }).open();
    };

    // 프로필
    const handleChangeProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setNewProfileFile(file);

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    }

    // 사원 등록 mutation
    const createMutation = useMutation({
        mutationFn: (formData: FormData) => memberCreate(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            alert('사원 등록 완료');
            onClose();
        },
        onError: () => {
            alert('사원 등록 실패');
        }
    });

    const handleCreate = () => {
        // 필수값 체크
        if (!createUser.email || !createUser.userName) {
            alert('이메일과 이름은 필수입니다.');
            return;
        }
        const formData = new FormData();
        formData.append('data', new Blob([JSON.stringify(createUser)], { type: 'application/json' }));
        if (newProfileFile) {
        formData.append('profile', newProfileFile);
        }
        createMutation.mutate(formData);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2 className="text-xl font-semibold mb-4">사원 등록</h2>

                <div className={styles.profileSection}>
                    <div className={styles.profileImage}>
                        <img src={preview || "/path/to/default/image.png"} alt="Profile" />
                        <label htmlFor="profile-image-upload" className={styles.plusIcon}>+</label>
                        <input id="profile-image-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChangeProfile} />
                    </div>
                </div>
                <div className={styles.infoGrid}>
                    <div className={styles.infoRow}>
                        <span>이메일</span>
                        <input type="email" name="email" value={createUser.email} onChange={handleChange} />
                    </div>
                    <div className={styles.infoRow}>
                        <span>사원명</span>
                        <input type="text" name="userName" value={createUser.userName} onChange={handleChange} />
                    </div>
                    <div className={styles.infoRow}>
                        <span>소속</span>
                        <div className={styles.depInputContainer} ref={depMapRef}>
                            <input
                                type="text"
                                name="depName"
                                value={createUser.depName || ''}
                                onClick={handleDepOpen}
                                readOnly
                            />
                            {isDepartmentMap && (
                                <div className={styles.depTreeContainer}>
                                    <DepartmentMap departmentSelect={handleDepSelect} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.infoRow}>
                        <span>직위</span>
                        <select name="posName" value={createUser.posName || ''} onChange={handleChange}>
                            {positions?.map(pos => (
                                <option key={pos.posId} value={pos.posName}>
                                    {pos.posName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.infoRow}>
                        <span>전화번호</span>
                        <input type="text" name="phone" value={createUser.phone || ''} onChange={handleChange} />
                    </div>
                    <div className={styles.infoRow}>
                        <span>내선번호</span>
                        <input type="text" name='extension' value={createUser.extension || ''} onChange={handleChange} />
                    </div>
                    <div className={styles.infoRow}>
                        <span>입사일</span>
                        <input type="date" name="hireDate" value={createUser.hireDate} onChange={handleChange} max={today}/>
                    </div>
                    <div className={styles.infoRow}>
                        <span>재직상태</span>
                        <select name="status" value={createUser.status} onChange={handleChange}>
                            <option value="T">재직</option>
                            <option value="F">퇴직</option>
                        </select>
                    </div>
                </div>

                <div className={styles.addressSection}>
                    <div className={styles.addressRow}>
                        <span>주소</span>
                        <input type="text" name="address" value={createUser.address || ''} onChange={handleChange} />
                        <button className={styles.addressButton} onClick={handleSearchAddress} >주소찾기</button>
                    </div>
                    <div className={styles.addressRow}>
                        <span>상세주소</span>
                        <input type="text" name="addressDetail" value={createUser.addressDetail || ''} onChange={handleChange} />
                    </div>
                </div>

                <div className={styles.buttonGroup}>
                    <button onClick={onClose}>취소</button>
                    <button onClick={handleCreate}>등록</button>
                </div>
            </div>
        </div>
    );
}
