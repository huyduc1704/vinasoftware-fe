'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { systemSettingsApi } from '@/utils/api';

interface SettingsContextType {
    logoUrl: string | null;
    logoPublicId: string | null;
    faviconUrl: string | null;
    faviconPublicId: string | null;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
    logoUrl: null,
    logoPublicId: null,
    faviconUrl: null,
    faviconPublicId: null,
    refreshSettings: async () => { },
});

export const useSettings = () => useContext(SettingsContext);
export default function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoPublicId, setLogoPublicId] = useState<string | null>(null);
    const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
    const [faviconPublicId, setFaviconPublicId] = useState<string | null>(null);

    const fetchSettings = async () => {
        try {
            const data = await systemSettingsApi.getSettings();
            setLogoUrl(data.WEBSITE_LOGO_URL);
            setLogoPublicId(data.WEBSITE_LOGO_PUBLIC_ID || null);
            setFaviconUrl(data.WEBSITE_FAVICON_URL);
            setFaviconPublicId(data.WEBSITE_FAVICON_PUBLIC_ID || null);
        } catch (error) {
            console.error('Failed to fetch system settings: ', error);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    //Hiệu ứng thay đổi favicon
    useEffect(() => {
        if (faviconUrl) {
            let link: HTMLLinkElement | null =
                document.querySelector("link[rel*='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'shorcut icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = faviconUrl;
        }
    }, [faviconUrl]);

    return (
        <SettingsContext.Provider value={{
            logoUrl, logoPublicId,
            faviconUrl, faviconPublicId,
            refreshSettings: fetchSettings
        }}>
            {children}
        </SettingsContext.Provider>
    );
}