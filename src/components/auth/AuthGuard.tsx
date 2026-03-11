'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spin, Layout, Skeleton } from 'antd';
import { authApi } from '@/utils/api';

const { Content, Header, Sider } = Layout;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Try to get the current user profile
                await authApi.getMe();
                setAuthenticated(true);
            } catch (error) {
                // Not authenticated, this is expected for guests
                setAuthenticated(false);
                // Only redirect if not already on the login page to avoid loops
                if (!pathname.includes('/login')) {
                    // Don't append returnUrl if it's just the root to keep URL clean
                    if (pathname === '/') {
                        router.push('/login');
                    } else {
                        router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router, pathname]);

    // If we're on the login page, just show children
    if (pathname.includes('/login')) {
        return <>{children}</>;
    }

    if (loading) {
        return (
            <Layout style={{ minHeight: '100vh', background: '#f8f9fa' }}>
                {/* Skeleton Sider */}
                <Sider width={260} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
                    <div style={{ height: 64, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                        <Skeleton.Button active size="small" style={{ width: 150 }} />
                    </div>
                    <div style={{ padding: '24px 16px' }}>
                        <Skeleton active paragraph={{ rows: 8 }} title={false} />
                    </div>
                </Sider>

                <Layout style={{ background: 'transparent' }}>
                    {/* Skeleton Header */}
                    <Header style={{ background: '#fff', padding: '0 32px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Skeleton.Button active size="small" style={{ width: 120 }} />
                        <Skeleton.Avatar active size="default" shape="circle" />
                    </Header>

                    <Content style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <Spin size="large" description="Đang kiểm tra đăng nhập..." />
                        <div style={{ marginTop: 24, width: '100%' }}>
                            <Skeleton active paragraph={{ rows: 10 }} />
                        </div>
                    </Content>
                </Layout>
            </Layout>
        );
    }

    // Otherwise, only show children if authenticated
    return authenticated ? <>{children}</> : null;
}
