import { useEffect, useState } from "react"
import style from "./CompanyPolicyMain.module.css"
import type { CompanyPolicy } from "../../types/companyPolicy";
import { useParams } from "react-router-dom";
import { getPolicies } from "../../api/companyPolicyApi";
import CoreFlowAi from "../../components/company_policy/CoreFlowAi";
import TableOfContents from "../../components/company_policy/TableOfContents";
import ComPolPaginator from "../../components/company_policy/ComPolPaginator";
import Tiptap from "../../components/company_policy/Tiptap";

export default function CompanyPolicyMain() {
    const [title, setTitle] = useState("");
    const [originalTitle, setOriginalTitle] = useState("");
    const [content, setContent] = useState("");
    const [originalContent, setOriginalContent] = useState("");
    const [policyId, setPolicyId] = useState(0);
    const [policyList, setPolicyList] = useState<CompanyPolicy[]>([]);
    let { policyNo } = useParams();
    const [showAi, setShowAi] = useState(false);
    const [showToC, setShowToC] = useState(false);

    const toggleAi = () => {
        setShowAi(!showAi);
    };
    const toggleToC = () => {
        setShowToC(!showToC);
    };

    useEffect(() => {
        getPolicies()
            .then(data => {
                if (policyNo) {
                    setTitle(data[Number(policyNo) - 1].title);
                    setContent(data[Number(policyNo) - 1].content);
                    setOriginalTitle(data[Number(policyNo) - 1].title);
                    setOriginalContent(data[Number(policyNo) - 1].content);
                    setPolicyId(data[Number(policyNo) - 1].policyId);
                    setPolicyList(data);
                } else {
                    setTitle(data[0].title);
                    setContent(data[0].content);
                    setOriginalTitle(data[0].title);
                    setOriginalContent(data[0].content);
                    setPolicyId(data[0].policyId);
                    setPolicyList(data);
                }
            })
            .catch(err => console.log(err));
    }, [policyNo]);

    return (
        <div className="flex">
            <div className={style["company-policy-main"]}>
                <header>
                    <h1 className="text-5xl" style={{ textAlign: "center" }}>CoreFlow 내부 규정</h1>
                </header>
                <main>
                    <input type="text" name="title" id="title" className={style.title} placeholder="제목" value={title} disabled />
                    <br />
                    {/* <textarea name="content" id="content" className={style.content} placeholder="내용" value={content} disabled ></textarea> */}
                    <Tiptap name="content" value={content} disabled={true} onChange={() => {}} />
                    {
                        showAi && <CoreFlowAi setShowModal={setShowAi} />
                    }
                    {
                        showToC && <TableOfContents policyList={policyList} setShowToC={setShowToC} />
                    }
                </main>
                <footer>
                    <div className={style["footer-left"]}>
                        <button type="button" onClick={toggleToC}>목차</button>
                        <button type="button" style={{ "marginLeft": "20px" }} onClick={toggleAi}>AI</button>
                    </div>
                    <div className={style["footer-center"]}>
                        <ComPolPaginator policyList={policyList} policyNo={policyNo} />
                    </div>
                    <div className={style["footer-right"]}>
                    </div>
                </footer>
            </div>
        </div>
    );
}