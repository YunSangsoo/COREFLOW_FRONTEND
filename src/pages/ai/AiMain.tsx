import { useEffect, useRef, useState } from "react"
import style from "./AiMain.module.css"
import { checkUsedBefore, createTitle, getSessions, insertAiUsage, sendPrompt } from "../../api/aiApi";
import { type message, type AiChatHistory, type AiChatSession } from "../../types/aiTypes";

export default function AiMain() {
    const [sessionNo, setSessionNo] = useState(0);
    const promptRef = useRef<HTMLInputElement>(null);
    const [sessionsList, setSessionsList] = useState<AiChatSession[]>([]);
    const [historyList, setHistoryList] = useState<AiChatHistory[]>([]);
    const [usedBefore, setUsedBefore] = useState(false);
    const [messages, setMessages] = useState<message[]>([{"role": "system", "content": ""}]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        getSessions()
        .then(data => setSessionsList(data))
        .catch(err => console.log(err));
    }, [])

    const sendQuery = async () => {
        const prompt = promptRef.current?.value.trim();
        let tokensUsed = 0;
        let title = "";

        if (prompt == null || prompt == "") {
            return;
        }

        messages.push({"role": "user", "content": prompt});
        setMessages([...messages]);

        setIsLoading(true);

        // 제목 만들기
        if (sessionNo == 0) {
            checkUsedBefore()
            .then(data => {
                setUsedBefore(data);

                if (!data) {

                }
            })
            .catch(err => console.log(err));

            createTitle(prompt)
            .then(res => {
                title = res.message.content;
                console.log(title);
                tokensUsed = res.eval_count + res.prompt_eval_count;    
            })
            .catch(err => console.log(err));

            // AI_USAGE 테이블에 행 삽입.
            insertAiUsage(tokensUsed)
            .then(res => console.log(res))
        }

        // 채팅하기
        sendPrompt(messages)
        .then(res => {
            console.log(res);
            messages.push({"role": "assistant", "content": res.message.content});
            setMessages([...messages]);
            tokensUsed = res.eval_count + res.prompt_eval_count;
        })
        .catch(err => console.log(err))
        .finally(() => {
            setIsLoading(false);
        });
    };    

    return (
        <div className={style["ai-body"]}>
            <h2 className="text-4xl font-bold">CoreFlow AI</h2>
            <div className={style["chat-container"]}>
                <div className={style["chat-box"]} id="response">
                    {
                        messages.map(message => {
                            if (message.role == "user") {
                                return (
                                    <div className={`${style["message"]} ${style["question"]}`}>{message.content}</div>
                                )
                            } else if (message.role == "assistant") {
                                return (
                                    <div className={`${style["message"]} ${style["answer"]}`}>{message.content}</div>
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
                    onKeyDown={(e) => {if (e.key === "Enter") {sendQuery()}}}/>
                    <button className={style["ai-button"]} onClick={sendQuery}>전송</button>
                </div>
            </div>
        </div>
    )
}