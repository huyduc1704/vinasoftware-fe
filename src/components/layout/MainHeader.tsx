'use client';

import React, { useEffect, useRef } from 'react';
import { Layout, Avatar, Space, Badge, Dropdown, MenuProps } from 'antd';
import { MenuOutlined, BellOutlined, CaretDownOutlined, LogoutOutlined } from '@ant-design/icons';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';
import { authApi } from '@/utils/api';

const { Header } = Layout;

export default function MainHeader() {
    const headerRef = useRef<HTMLElement>(null);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            router.push('/login');
        }
    };

    const userMenuProps: MenuProps = {
        items: [
            {
                key: 'logout',
                label: 'Đăng xuất',
                icon: <LogoutOutlined />,
                onClick: handleLogout,
            },
        ],
    };

    useEffect(() => {
        if (headerRef.current) {
            gsap.fromTo(
                headerRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.6, ease: 'power2.out' }
            );
        }
    }, []);

    return (
        <Header
            ref={headerRef}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fff',
                padding: '0 32px',
                borderBottom: '1px solid #f0f0f0',
                height: 64,
                lineHeight: '64px'
            }}
        >
            <Space size="middle" style={{ display: 'flex', alignItems: 'center' }}>
                <MenuOutlined style={{ fontSize: '18px', cursor: 'pointer', color: '#595959' }} />
                <span style={{ fontSize: '14px', color: '#8c8c8c' }}>
                    Xin chào, <strong style={{ color: '#262626' }}>admin</strong>!
                </span>
            </Space>

            <Space size="large" align="center">
                <Badge dot offset={[-4, 4]}>
                    <BellOutlined style={{ fontSize: '20px', color: '#595959', cursor: 'pointer' }} />
                </Badge>

                <Space style={{ cursor: 'pointer', marginLeft: '12px' }}>
                    <div style={{ width: 22, height: 22, background: '#e11d48', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFCD00', fontSize: '12px', fontWeight: 'bold' }}>
                        ★
                    </div>
                    <span style={{ fontWeight: 500, fontSize: '14px' }}>VN</span>
                    <CaretDownOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
                </Space>

                <Dropdown menu={userMenuProps} trigger={['click']} placement="bottomRight">
                    <Space style={{ cursor: 'pointer', marginLeft: '8px' }}>
                        <Avatar
                            size={36}
                            style={{ backgroundColor: '#fadb14' }}
                            src={`https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=fadb14`}
                        />
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>Admin kế toán</span>
                        <CaretDownOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
                    </Space>
                </Dropdown>
            </Space>
        </Header>
    );
}
