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
        enabled: !!searchName,
    });

    if (isLoading) {
        return <div className="py-4 text-center text-gray-500">사원 목록을 불러오는 중...</div>;
    }

    if (isError) {
        return <div className="py-4 text-center text-red-500">사원 목록을 불러오는 데 실패했습니다.</div>;
    }

    const filteredMembers = Array.isArray(data) ? data.filter(item => item.userName.includes(searchName)) : [];

    if (filteredMembers.length === 0) {
        return null;
    }

    return (
        <div className="absolute w-full top-full left-0 z-20">
            <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6 border border-gray-200">
                <table className="w-full text-sm divide-y divide-gray-200">
                    <thead className="bg-blue-100 border-b border-blue-200">
                        <tr>
                            <th className="p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700 w-[20%]">사원번호</th>
                            <th className="p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700 w-[30%]">사원명</th>
                            <th className="p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700 w-[30%]">부서</th>
                            <th className="p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700 w-[20%]">직위</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredMembers.map((member) => (
                            <tr
                                key={member.userNo}
                                className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition duration-150 cursor-pointer"
                                onClick={() => onSelectMember(member)}
                            >
                                <td className="p-3 text-center font-medium text-gray-700">{member.userNo}</td>
                                <td className="p-3 text-center text-gray-800 font-medium">{member.userName}</td>
                                <td className="p-3 text-center text-gray-700">{member.depName}</td>
                                <td className="p-3 text-center text-gray-700">{member.posName}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}