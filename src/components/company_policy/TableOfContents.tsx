import type { CompanyPolicy } from "../../types/companyPolicy";

export default function TableOfContents({policyList, setShowToC}:{policyList:CompanyPolicy[], setShowToC:(bool:boolean) => void}) {
    const handleLiClick = (policyNo:number) => {
        location.href = `/cpolicies/${policyNo}`;
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.5)'
            }}
            onClick={() => setShowToC(false)}  // 배경 클릭시 닫기
        >
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'white',
                    padding: '20px',
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    maxHeight: '80vh',  // 화면 높이의 80%로 제한
                    maxWidth: '80vw',   // 화면 너비의 80%로 제한 (선택사항)
                    overflow: 'auto',   // 스크롤 활성화
                }}
                onClick={(e) => e.stopPropagation()}  // 내용 클릭시 닫히지 않게
            >
                <h2>목차</h2>
                <ol>
                    {
                        policyList && policyList.map((policy, index) => (
                            <li key={policy.policyId} style={{"cursor":"pointer", "margin":"20px", "listStyle":"-moz-initial"}}
                            onClick={() =>handleLiClick(index + 1)}>{policy.title}</li>
                        ))
                    }
                </ol>
                <button onClick={() => setShowToC(false)}>닫기</button>
            </div>
        </div>
    );
}