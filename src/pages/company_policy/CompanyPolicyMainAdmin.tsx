import { useEffect, useState } from "react"
import style from "./CompanyPolicyMain.module.css"
import { addPolicy, getPolicies, updatePolicy } from "../../api/companyPolicyApi";
import ComPolPaginator from "../../components/company_policy/ComPolPaginator";
import { type CompanyPolicy } from "../../types/companyPolicy";

export default function CompanyPolicyMainAdmin() {
    const [title, setTitle] = useState("");
    const [originalTitle, setOriginalTitle] = useState("");
    const [content, setContent] = useState("");
    const [originalContent, setOriginalContent] = useState("");
    const [policyId, setPolicyId] = useState(0);
    const [titleDisabled, setTitleDisabled] = useState(true);
    const [policyList, setPolicyList] = useState<CompanyPolicy[]>([]);

    const handleTitleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };
    const handleContentChange = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    };
    const handleAddClick = () => {
        const bool = confirm("새 규정을 추가하시겠습니까? 저장을 꼭 하고 확인을 눌러주세요.");
        if (bool) {
            setTitleDisabled(false);
            setTitle("");
            setContent("");
            setPolicyId(0);
        }
    }
    const handleSave = () => {
        const bool = confirm("저장하시겠습니까?");
        if (bool) {
            if (policyId === 0) {
                addPolicy(title, content)
                .then(res => {
                    console.log(res.data);
                    setPolicyId(res.data.policyId);
                })
                .catch(err => console.log(err))
                .finally(() => {
                    setOriginalTitle(title);
                    setOriginalContent(content);
                    setTitleDisabled(true);
                });
            } else {
                updatePolicy(policyId, content)
                .then(res => console.log(res))
                .catch(err => console.log(err))
                .finally(() => {
                    setOriginalTitle(title);
                    setOriginalContent(content);
                });
            }
        }
    }

    useEffect(() => {
        getPolicies()
        .then(data => {
            console.log(data);
            setTitle(data[0].title);
            setContent(data[0].content);
            setOriginalTitle(data[0].title);
            setOriginalContent(data[0].content);
            setPolicyId(data[0].policyId);
            setPolicyList(data);
        })
        .catch(err => console.log(err));
    }, [])

    return (
        <div className={style["company-policy-main"]}>
            <header>
                <h1 style={{ textAlign: "center" }}>CoreFlow 내부 규정(관리자 모드)</h1>
            </header>
            <main>
                <input type="text" name="title" id="title" className={style.title} placeholder="제목" value={title} onChange={handleTitleChange} disabled={titleDisabled} />
                <p>*제목은 수정할 수 없습니다.</p>
                <textarea name="content" id="content" className={style.content} placeholder="내용" value={content} onChange={handleContentChange}></textarea>
            </main>
            <footer>
                <div className={style["footer-left"]}>
                    <p>a</p>
                </div>
                <div className={style["footer-center"]}>
                    <ComPolPaginator policyList={policyList} />
                </div>
                <div className={style["footer-right"]}>
                    {
                        (title != originalTitle) || (content != originalContent) ? <button type="button" onClick={handleSave}>저장</button> : <></>
                    }
                    <button type="button" onClick={handleAddClick} className={style["margin-btn"]}>규정 추가</button>
                    <button type="button" className={style["margin-btn"]}>규정 삭제</button>
                </div>
            </footer>
        </div>
    )
}