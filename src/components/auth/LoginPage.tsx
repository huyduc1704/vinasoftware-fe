'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Typography, Space, ConfigProvider, Alert } from 'antd';
import { UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { authApi } from '@/utils/api';

const { Title, Text, Link } = Typography;

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const router = useRouter();

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            setErrorMsg('');
            await authApi.login({ username: values.username, password: values.password });
            router.push('/');
        } catch (err: any) {
            setErrorMsg(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#262626', overflow: 'hidden' }}>
            {/* Left Side - Yellow color requested by user */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '48px',
                    background: '#FFCD00', // Yellow background
                    color: '#000',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >

                {/* Concentric Circles Background (matching the image) */}
                <div style={{
                    position: 'absolute',
                    width: '60vw',
                    height: '60vw',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '50%',
                    top: '30%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none'
                }}></div>
                <div style={{
                    position: 'absolute',
                    width: '40vw',
                    height: '40vw',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '50%',
                    top: '30%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none'
                }}></div>

                <div style={{ maxWidth: '400px', textAlign: 'center', zIndex: 1, marginTop: '-15%' }}>
                    <Title level={1} style={{ fontSize: '56px', fontWeight: 700, color: '#141414', marginBottom: '24px', lineHeight: 1.1, letterSpacing: '-2px' }}>
                        Phần mềm <br /> kế toán
                    </Title>
                </div>



            </div>

            {/* Right Side - Login Form */}
            <div
                style={{
                    flex: 1,
                    background: '#fff',
                    borderRadius: '48px 0 0 48px',
                    padding: '48px 64px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    marginLeft: '-48px',
                    zIndex: 10,
                    boxShadow: '-10px 0 30px rgba(0,0,0,0.05)'
                }}
            >
                {/* Header (Logo + Sign Up) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 'auto' }}>
                    {/* Replaced with user's specific logo path */}
                    <div style={{ width: '150px', height: '40px', position: 'relative' }}>
                        <Image
                            src="/logo/logo-vns.png"
                            alt="Vinasoftware"
                            fill
                            style={{ objectFit: 'contain', objectPosition: 'left' }}
                            priority
                        />
                    </div>

                    {/* <Link href="#" style={{ color: '#595959', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserOutlined /> Đăng ký
                    </Link> */}
                </div>

                {/* Form Container */}
                <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Title level={2} style={{ fontSize: '42px', fontWeight: 500, color: '#1f1f1f', marginBottom: '48px', letterSpacing: '-1px' }}>
                        Đăng nhập
                    </Title>

                    <ConfigProvider
                        theme={{
                            components: {
                                Input: {
                                    activeBorderColor: '#d32f2f',
                                    hoverBorderColor: '#ff4d4f',
                                },
                            },
                        }}
                    >
                        <Form
                            name="login"
                            initialValues={{ remember: true }}
                            onFinish={onFinish}
                            layout="vertical"
                            size="large"
                        >
                            {errorMsg && (
                                <Alert
                                    title={errorMsg}
                                    type="error"
                                    showIcon
                                    style={{ marginBottom: '24px', borderRadius: '8px' }}
                                />
                            )}
                            <Form.Item
                                name="username"
                                rules={[{ required: true, message: 'Vui lòng nhập Email hoặc tên người dùng!' }]}
                                style={{ marginBottom: '24px' }}
                            >
                                <Input
                                    placeholder="Email hoặc Tên người dùng"
                                    style={{
                                        borderRadius: '24px',
                                        padding: '16px 24px',
                                        fontSize: '15px',
                                        backgroundColor: '#fff',
                                        border: '1px solid #d9d9d9',
                                        boxShadow: 'none'
                                    }}
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                                style={{ marginBottom: '16px' }}
                            >
                                <Input.Password
                                    placeholder="Mật khẩu"
                                    style={{
                                        borderRadius: '24px',
                                        padding: '16px 24px',
                                        fontSize: '15px',
                                        backgroundColor: '#fff',
                                        border: '1px solid #d9d9d9',
                                        boxShadow: 'none'
                                    }}
                                />
                            </Form.Item>

                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '32px' }}>
                                <Link href="#" style={{ color: '#d32f2f', fontSize: '14px', fontWeight: 500 }}>
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={loading}
                                    icon={!loading && <ArrowRightOutlined style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)' }} />}
                                    style={{
                                        height: '56px',
                                        borderRadius: '28px',
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        background: 'linear-gradient(90deg, #ff4d4f 0%, #d32f2f 100%)',
                                        border: 'none',
                                        position: 'relative',
                                        textAlign: 'center',
                                        boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
                                    }}
                                >
                                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                </Button>
                            </Form.Item>
                        </Form>
                    </ConfigProvider>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '13px', color: '#bfbfbf', marginTop: 'auto' }}>
                    <span>© Powered by Thiết Kế Website Vina Software (VNS)</span>
                    <Space size="large">
                        <Link href="#" style={{ color: '#8c8c8c' }}>Liên hệ</Link>
                        <Link href="#" style={{ color: '#8c8c8c' }}>Tiếng Việt ∨</Link>
                    </Space>
                </div>
            </div>
        </div>
    );
}
