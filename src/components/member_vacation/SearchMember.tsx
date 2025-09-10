import { useQuery } from "@tanstack/react-query";
import type { MemberChoice } from "../../types/vacation";
import { memChoice } from "../../api/vacationApi";

interface SearchMemberProps {
    searchName: string;
    onSelectMember: (member: MemberChoice) => void;
}

export default function SearchMember({ searchName, onSelectMember }: SearchMemberProps) {
    const { data, isLoading, isError } = useQuery<MemberChoice[]>({
        queryKey: ['searchMembers', searchName],
        queryFn: ({ queryKey }) => {
            const [, actualSearchTerm] = queryKey;
            return memChoice(actualSearchTerm as string);
        },
        // 1. searchName에 값이 있을 때만 쿼리를 실행하도록 설정
        enabled: !!searchName,
    });

    // 2. 데이터 로딩 중일 때 UI
    if (isLoading) {
        return <div className="py-4 text-center text-gray-500">사원 목록을 불러오는 중...</div>;
    }

    // 3. 에러 발생 시 UI
    if (isError) {
        return <div className="py-4 text-center text-red-500">사원 목록을 불러오는 데 실패했습니다.</div>;
    }

    // 4. API에서 받은 데이터를 기반으로 필터링
    const filteredMembers = Array.isArray(data) ? data.filter(item => item.userName.includes(searchName)):[];

    // 5. 필터링된 결과가 없을 경우 아무것도 렌더링하지 않음
    if (filteredMembers.length === 0) {
        return null;
    }

    // 6. 필터링된 결과가 있을 경우에만 테이블을 렌더링
    return (
        <div className="border border-gray-300 rounded overflow-hidden">
            <div className="bg-white">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-600 text-white">
                            <th className="px-3 py-2 text-center font-medium w-50">사원번호</th>
                            <th className="px-3 py-2 text-center font-medium w-40">사원명</th>
                            <th className="px-3 py-2 text-center font-medium w-30">부서</th>
                            <th className="px-3 py-2 text-center font-medium w-30">직위</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMembers.map((member) => (
                            <tr
                                key={member.userNo}
                                className="border-b border-gray-300 hover:bg-gray-200 cursor-pointer"
                                onClick={() => onSelectMember(member)}
                            >
                                <td className="px-3 py-2 text-center">{member.userNo}</td>
                                <td className="px-3 py-2 text-center">{member.userName}</td>
                                <td className="px-3 py-2 text-center">{member.depName}</td>
                                <td className="px-3 py-2 text-center">{member.posName}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
