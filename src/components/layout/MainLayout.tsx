'use client';

import React from 'react';
import { Layout } from 'antd';
import { usePathname } from 'next/navigation';
import MainHeader from './MainHeader';
import MainSider from './MainSider';
import MainFooter from './MainFooter';
import AuthGuard from '../auth/AuthGuard';

const { Content } = Layout;

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname?.includes('/login');

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <AuthGuard>
            <Layout style={{ minHeight: '100vh', background: '#f8f9fa' }}>
                <MainSider />
                <Layout style={{ background: 'transparent' }}>
                    <MainHeader />
                    <Content
                        style={{
                            padding: '24px 32px',
                            margin: 0,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {children}
                        <MainFooter />
                    </Content>
                </Layout>
            </Layout>
        </AuthGuard>
    );
}
