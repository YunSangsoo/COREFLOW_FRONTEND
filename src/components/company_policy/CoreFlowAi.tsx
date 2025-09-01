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
            onClick={() => setShowModal(false)}  // 배경 클릭시 닫기
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
                <h2>CoreFlow AI</h2>
                <iframe src="/faqServiceFront.html" width="1000px" height="700px" />
                <button onClick={() => setShowModal(false)}>닫기</button>
            </div>
        </div>
    )
}