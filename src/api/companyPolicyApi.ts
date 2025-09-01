import axios from "axios";
import { type CompanyPolicy } from "../types/companyPolicy";

export const api = axios.create({
    baseURL: "http://localhost:8081/api/cpolicies",
    withCredentials: false
});

export const getPolicies = async () => {
    const response = await api.get<CompanyPolicy[]>("");
    return response.data;
};

export const addPolicy = async (title:string, content:string) => {
    const response = await api.post("", {
        title,
        content
    });
    return response;
}

export const updatePolicy = async (policyId:number, modContent:string) => {
    const response = await api.patch(`/${policyId}`, {
        modContent
    });
    return response;
}