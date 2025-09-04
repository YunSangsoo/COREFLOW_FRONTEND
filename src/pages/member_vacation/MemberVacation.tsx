
// Hardcoded data for the table
const annualLeaveData = [
  { no: 1, period: "0년차", days: 12 },
  { no: 2, period: "1 ~ 2년차", days: 15 },
  { no: 3, period: "3 ~ 4년차", days: 16 },
  { no: 4, period: "5 ~ 6년차", days: 17 },
  { no: 5, period: "7 ~ 8년차", days: 18 },
  { no: 6, period: "9 ~ 10년차", days: 19 },
  { no: 7, period: "11 ~ 12년차", days: 20 },
  { no: 8, period: "13 ~ 14년차", days: 21 },
  { no: 9, period: "15 ~ 16년차", days: 22 },
  { no: 10, period: "17 ~ 18년차", days: 23 },
  { no: 11, period: "19 ~ 20년차", days: 24 },
  { no: 12, period: "21년차 이상", days: 25 },
];

const menuItems = [
  "기본 연차 관리",
  "사원 연차 관리",
  "내 연차 관리",
];

export default function MemberVacation() {
    return (
    <div className="flex bg-gray-100 min-h-screen p-8 font-sans">
      {/* Left Navigation Menu */}
      <div className="w-1/4 max-w-xs pr-8">
        <h1 className="text-2xl font-bold mb-8">연차관리</h1>
        <div className="flex flex-col space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={item}
              className={`text-left py-2 px-4 rounded-md transition-colors duration-200 
              ${index === 0
                ? 'bg-gray-300 text-gray-800 font-semibold'
                : 'bg-white text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold mb-6">기본 연차 관리</h2>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-center">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-2 px-4 rounded-tl-lg">no</th>
                <th className="py-2 px-4">근로기간</th>
                <th className="py-2 px-4 rounded-tr-lg">연차 일 수</th>
              </tr>
            </thead>
            <tbody>
              {annualLeaveData.map((row, index) => (
                <tr key={row.no} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200`}>
                  <td className="py-2 px-4 text-gray-700">{row.no}</td>
                  <td className="py-2 px-4 text-gray-700">{row.period}</td>
                  <td className="py-2 px-4 text-gray-700">{row.days}일</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};