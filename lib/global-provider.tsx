
import React, { createContext, useContext, ReactNode } from "react";

import { getCurrentUser } from "@/lib/appwrite";
import { useAppwrite } from "./useAppwrite";
import { Redirect } from "expo-router";


interface User {
    $id : string
    name: string
    email: string
    avatar: string
}
interface GlobalContextType {
    isLoggedIn: boolean
    user: User | null
    loading: boolean
    refetch: (newParams?: Record<string, string | number>) => Promise<void>
}

interface GlobalProviderProps {
    children: ReactNode;
}


const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: GlobalProviderProps) => {
    const {
        data: user,
        loading,
        refetch,
    } = useAppwrite({
        fn: getCurrentUser,
    });

    const isLoggedIn = !!user;
    console.log(JSON.stringify(user)) //can remove later, this just shows us user is there
    return (
        <GlobalContext.Provider
            value={{
                isLoggedIn,
                user,
                loading,
                refetch,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalContext = (): GlobalContextType => {
    const context = useContext(GlobalContext);
    if (!context)
        throw new Error("useGlobalContext must be used within a GlobalProvider");

    return context;
};

export default GlobalProvider;