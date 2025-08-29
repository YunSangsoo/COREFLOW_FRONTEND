import axios from "axios";
import { type CompanyPolicy } from "../types/companyPolicy";

export const api = axios.create({
    baseURL: "http://localhost:8081/api",
    withCredentials: false
});

export const getPolicies = async () => {
    const response = await api.get<CompanyPolicy[]>("cpolicies");
    return response.data;
};