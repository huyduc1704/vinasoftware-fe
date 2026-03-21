'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from 'antd';
import { systemSettingsApi } from '@/utils/api';

const { Footer } = Layout;

export default function MainFooter() {
    const [footerData, setFooterData] = useState({
        show: true,
        title: '',
        content: ''
    });

    useEffect(() => {
        const fetchFooter = async () => {
            try {
                const settings = await systemSettingsApi.getSettings();
                setFooterData({
                    show: settings.FOOTER_SHOW !== 'false',
                    title: settings.FOOTER_TITLE_VI || '',
                    content: settings.FOOTER_CONTENT_VI || ''
                });
            } catch (error) {
                console.error('Failed to fetch footer data:', error);
            }
        };
        fetchFooter();
    }, []);

    if (!footerData.show) return null;

    return (
        <Footer
            style={{
                textAlign: 'left',
                background: '#ffffffff',
                color: '#030303ff',
                padding: '24px 50px',
                borderTop: '1px solid #f0f0f0',
                borderRadius: '8px',
                marginTop: '12px',
                marginBottom: '12px',
            }}
        >
            {(footerData.title || footerData.content) ? (
                <div>
                    {footerData.title && (
                        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>
                            {footerData.title}
                        </div>
                    )}
                    {footerData.content && (
                        <div className="custom-footer-content" dangerouslySetInnerHTML={{ __html: footerData.content }} />
                    )}
                </div>
            ) : (
                <>
                    Vina Software Web Design | Thiết kế website cung cấp Hosting & Domain - Digital Marketing
                    <br />
                    <p style={{ color: '#898989' }}>Tel: 028 220 040 | Hotline: 0938 166 234 - 0909 633 601 - 0902 670 499 | Email: vns@vinasoftware.com</p>
                </>
            )}
        </Footer>
    );
}
