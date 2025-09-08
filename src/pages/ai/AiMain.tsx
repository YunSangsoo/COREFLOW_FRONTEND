import { useEffect, useRef, useState } from "react"
import style from "./AiMain.module.css"
import { checkUsedBefore, createTitle, deleteChatSession, getAiChatHistory, getSessions, insertAiChatHistory, insertAiChatSession, insertAiUsage, sendPrompt, updateAiChatSession, updateAiUsage } from "../../api/aiApi";
import { type message, type AiChatHistory, type AiChatSession } from "../../types/aiTypes";

export default function AiMain() {
    const [sessionId, setSessionId] = useState(0);
    const promptRef = useRef<HTMLInputElement>(null);
    const [sessionsList, setSessionsList] = useState<AiChatSession[]>([]);
    const [historyList, setHistoryList] = useState<AiChatHistory[]>([]);
    const [messages, setMessages] = useState<message[]>([{ "role": "system", "content": "" }]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        getSessions()
        .then(data => setSessionsList(data))
        .catch(err => console.log(err));
    }, [])

    const sendQuery = async () => {
        const prompt = promptRef.current?.value.trim();
        
        if (promptRef.current) {
            promptRef.current.value = "";
        }

        let tokensUsed = 0;
        let title = "";
        let usedBefore = false;
        let modelResponse = "";
        let currentSession = 0;

        if (prompt == null || prompt == "") {
            return;
        }

        messages.push({ "role": "user", "content": prompt });
        setMessages([...messages]);

        setIsLoading(true);

        await checkUsedBefore()
        .then(data => {
            usedBefore = data;
        })
        .catch(err => console.log(err));

        // 제목 만들기
        if (sessionId == 0) {
            await createTitle(prompt)
                .then(res => {
                    title = res.message.content;
                    tokensUsed += res.eval_count + res.prompt_eval_count;
                })
                .catch(err => console.log(err));

            await insertAiChatSession(title)
                .then(data => {
                    setSessionId(data);
                    currentSession = data;
                })
                .catch(err => console.log(err));

            await getSessions()
                .then(data => setSessionsList(data))
                .catch(err => console.log(err));
        }

        // 채팅하기
        await sendPrompt(messages)
            .then(res => {
                modelResponse = res.message.content;
                messages.push({ "role": "assistant", "content": modelResponse });
                setMessages([...messages]);
                tokensUsed += res.eval_count + res.prompt_eval_count;
            })
            .catch(err => console.log(err))
            .finally(() => {
                setIsLoading(false);
            });

        if (usedBefore) {
            await updateAiUsage(tokensUsed)
                .then(res => {})
                .catch(err => console.log(err));
        } else {
            // AI_USAGE 테이블에 행 삽입.
            await insertAiUsage(tokensUsed)
                .then(res => {})
                .catch(err => console.log(err));
        }

        const targetId = sessionId === 0 ? currentSession : sessionId;
        
        await updateAiChatSession(targetId)
        .then(res => {})
        .catch(err => console.log(err));

        await insertAiChatHistory(targetId, "user", prompt)
            .then(res => {})
            .catch(err => console.log(err));

        await insertAiChatHistory(targetId, "assistant", modelResponse)
            .then(res => {})
            .catch(err => console.log(err));
    };

    const sessionClick = async (liSessionId:number) => {
        setMessages([{ "role": "system", "content": "" }]);

        setSessionId(liSessionId);

        await getAiChatHistory(liSessionId)
        .then(data => {
            setHistoryList(data);
            
            setMessages(prev => ([
                ...prev,
                ...data.map(history => ({"role": history.role, "content": history.content}))
            ]));
        })
        .catch(err => console.log(err));
    };

    const deleteSession = async (liSessionId:number) => {
        const bool = confirm("정말 삭제하시겠습니까?");

        if (bool) {
            await deleteChatSession(liSessionId)
            .then(res => {})
            .catch(err => console.log(err));
    
            await getSessions()
            .then(data => setSessionsList(data))
            .catch(err => console.log(err));

            clickNewChat();
        }
    };

    const clickNewChat = () => {
        setMessages([{ "role": "system", "content": "" }]);
        setSessionId(0);
    };

    return (
        <>
            <h2 className="text-4xl font-bold">CoreFlow AI</h2>
            <div className={style["ai-body"]}>
                <div className={style["nav"]}>
                    <button type="button" style={{"alignSelf": "baseline", "marginBottom":"30px"}}
                    className="border-solid border-amber-400" onClick={clickNewChat}>+ 새 채팅</button>
                    <ul>
                        {
                            sessionsList && sessionsList.map(session => (
                            session.sessionId == sessionId ? <li key={session.sessionId} className={`mb-2 ${style["session-li"]}`}>
                                <p className={`bg-amber-500 ${style["session-p"]}`} onClick={() => sessionClick(session.sessionId)}>{session.title}</p>
                                <button type="button" onClick={() => deleteSession(session.sessionId)}>삭제</button>
                            </li>
                            : <li key={session.sessionId} className={`mb-2 ${style["session-li"]}`}>
                                <p className={style["session-p"]} onClick={() => sessionClick(session.sessionId)}>{session.title}</p>
                                <button type="button" onClick={() => deleteSession(session.sessionId)}>삭제</button>
                            </li>
                        ))
                        }
                    </ul>
                </div>
                <div className={style["chat-container"]}>
                    <div className={style["chat-box"]} id="response">
                        {
                            messages.map((message, index) => {
                                if (message.role == "user") {
                                    return (
                                        <div key={index} className={`${style["message"]} ${style["question"]}`}>{message.content}</div>
                                    )
                                } else if (message.role == "assistant") {
                                    return (
                                        <div key={index} className={`${style["message"]} ${style["answer"]}`}>{message.content}</div>
                                    )
                                }
                            })
                        }
                        {
                            isLoading && <p>AI가 응답하는 중입니다...</p>
                        }
                    </div>
                    <div className={style["input-container"]}>
                        <input className={style["ai-input"]} type="text" id="question" placeholder="질문을 입력하세요..." ref={promptRef}
                            onKeyDown={(e) => { if (e.key === "Enter") { sendQuery() } }} />
                        <button className={style["ai-button"]} onClick={sendQuery}>전송</button>
                    </div>
                </div>
            </div>
        </>
    )
}