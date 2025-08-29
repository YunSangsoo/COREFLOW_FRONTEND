import { useEffect, useState } from "react"
import style from "./CompanyPolicyMain.module.css"

export default function CompanyPolicyMain() {
    const [title, setTitle] = useState("");
    const [originalTitle, setOriginalTitle] = useState("");
    const [content, setContent] = useState("");
    const [originalContent, setOriginalContent] = useState("");

    const handleTitleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };
    const handleContentChange = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    };

    useEffect(() => {
        
    }, [])

    return (
        <div className={style["company-policy-main"]}>
            <header>
                <h1 style={{ textAlign: "center" }}>CoreFlow 내부 규정</h1>
            </header>
            <main>
                <input type="text" name="title" id="title" className={style.title} placeholder="제목" value={title} onChange={handleTitleChange} />
                <textarea name="content" id="content" className={style.content} placeholder="내용" value={content} onChange={handleContentChange}></textarea>
            </main>
            <footer>
                <div className="footer-left">
                    <p>a</p>
                </div>
                <div className="footer-center">
                    <p>b</p>
                </div>
                <div className="footer-right">
                    {
                        (title != originalTitle) || (content != originalContent) ? <button type="button">저장</button> : <></>
                    }
                </div>
            </footer>
        </div>
    )
}