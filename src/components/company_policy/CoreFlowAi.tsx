import AiMain from "../../pages/ai/AiMain";

export default function CoreFlowAi({setShowModal}:{setShowModal:(bool:boolean)=>void}) {
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
            // onClick={() => setShowModal(false)}  // 배경 클릭시 닫기
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
                    alignItems: "center"
                }}
                onClick={(e) => e.stopPropagation()}  // 내용 클릭시 닫히지 않게
            >
                <AiMain/>
                <p style={{"color":"red"}}>주의 사항: 사내 문서 검색시 시간이 조금 오래 걸립니다. (30초+)</p>
                {/* <p>예시: CoreFlow의 휴가 규정에 대해서 알려줘.</p> */}
                <br />
                <button onClick={() => setShowModal(false)} className="border-amber-500">닫기</button>
            </div>
        </div>
    )
}