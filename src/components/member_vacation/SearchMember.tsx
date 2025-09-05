
export default function SearchMember() {

    
    return (
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
                {
                    // data?.map((member) => (
                    //     <tr key={member.userNo} className="border-b border-gray-300">
                    //         <td className="px-3 py-2 text-center bg-gray-100">{member.userNo}</td>
                    //         <td className="px-3 py-2 text-center">{member.userName}</td>
                    //         <td className="px-3 py-2 text-center">{member.depName}</td>
                    //         <td className="px-3 py-2 text-center">{member.posName}</td>
                    //     </tr>
                    // ))
                }
            </tbody>
        </table>
    );
}