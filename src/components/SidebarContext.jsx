'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
    const [ sidebarMode, setSidebarMode ] = useState('pilot');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedMode = localStorage.getItem('sidebarMode') || 'pilot';
            setSidebarMode(savedMode);
        }
    }, []);

    const updateSidebarMode = (mode) => {
        setSidebarMode(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarMode', mode);
        }
    };

    return (
        <SidebarContext.Provider value={{ sidebarMode, updateSidebarMode }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
