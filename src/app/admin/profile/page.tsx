'use client';

import React, { useEffect, useState } from 'react';
import {
    Card,
    Descriptions,
    Typography,
    Button,
    Space,
    Tag,
    Avatar,
    Divider,
    Modal,
    Form,
    Input,
    App,
    Row,
    Col,
    Spin,
} from 'antd';

import {
    UserOutlined,
    KeyOutlined,
    MailOutlined,
    PhoneOutlined,
    SafetyCertificateOutlined,
    EditOutlined,
    CalendarOutlined,
} from '@ant-design/icons';

import { authApi } from '@/utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function AdminProfilePage() {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false)

    // Fetch user data
    const fetchUserProfile = async () => {
        setLoading(true);
        try {
            const data = await authApi.getMe();
            setUser(data);
        } catch (error: any) {
            message.error('Không thể tải thông tin profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const handleChangePassword = async (values: any) => {
        setSubmitting(true);
        try {
            await authApi.changePassword({
                oldPassword: values.oldPassword,
                newPassword: values.newPassword
            });
            message.success('Đổi mật khẩu thành công');
            setIsModalOpen(false);
            form.resetFields();
        } catch (error: any) {
            message.error('Đổi mật khẩu thất bại: ' + error.message);
        } finally {
            setSubmitting(false)
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '100px', textAlign: 'center' }}>
                <Spin size="large" description="Đang tải thông tin..." />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <Title level={2}>
                Thông tin tài khoản Admin
            </Title>
            <Text type='secondary'>Quản lý thông tin cá nhân và thiết lập bảo mật tài khoản.</Text>
            <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col xs={24} md={8}>
                    <Card style={{ textAlign: 'center', height: '100%', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Avatar
                            size={120}
                            icon={<UserOutlined />}
                            src={user?.avatarUrl}
                            style={{ backgroundColor: '#f4d03f', marginBottom: '16px' }}
                        />
                        <Title level={4} style={{ marginBottom: '4px' }}>{user?.name || user?.username}</Title>
                        <Tag color='gold' style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '4px' }}>
                            {user?.role?.[0]?.name || 'Quản trị viên'}
                        </Tag>

                        <Divider />

                        <div style={{ textAlign: 'left' }}>
                            <Space orientation='vertical' size='middle' style={{ width: '100%' }}>
                                <div>
                                    <Text type='secondary'>
                                        <CalendarOutlined />Ngày tham gia
                                    </Text>
                                    <div style={{ fontWeight: 500 }}>
                                        {user?.createdAt ? dayjs(user.createdAt).format('DD/MM/YYYY') : 'N/A'}
                                    </div>
                                    <div>
                                        <Text type='secondary'>
                                            <SafetyCertificateOutlined />Trạng thái
                                        </Text>
                                        <div>
                                            <Tag color='success'>Đang hoạt động</Tag>
                                        </div>
                                    </div>
                                </div>
                            </Space>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Space orientation='vertical' size='large' style={{ width: '100%' }}>
                        <Card
                            title={<><UserOutlined />Thông tin chi tiết</>}
                            style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        >
                            <Descriptions column={1} bordered size='middle'>
                                <Descriptions.Item label="Tên đăng nhập">
                                    <Text strong>{user?.username}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Họ và tên">
                                    {user?.name || 'Chưa cập nhật'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Email">
                                    <Space><MailOutlined /> {user?.email || 'N/A'}</Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="Số điện thoại">
                                    <Space><PhoneOutlined /> {user?.phone || 'N/A'}</Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="Quyền hạn">
                                    {user?.roles?.map((role: any) => (
                                        <Tag key={role.id} color="blue">{role.name}</Tag>
                                    )) || 'N/A'}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {/* Thông tin bảo mật */}
                        <Card
                            title={<><KeyOutlined />Bảo mật tài khoản</>}
                            style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Text strong>Mật khẩu đăng nhập</Text>
                                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Cập nhật mật khẩu định kỳ để bảo vệ tài khoản của bạn.</div>
                                </div>
                                <Button
                                    type='primary'
                                    icon={<EditOutlined />}
                                    onClick={() => setIsModalOpen(true)}
                                    style={{ backgroundColor: '#f4d03f', borderColor: '#000000' }}
                                >
                                    Đổi mật khẩu
                                </Button>
                            </div>
                        </Card>
                    </Space>
                </Col>
            </Row>

            {/* Modal đổi mật khẩu */}
            <Modal
                title="Đổi mật khẩu tài khoản"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout='vertical'
                    onFinish={handleChangePassword}
                    style={{ marginTop: '20px' }}
                >
                    <Form.Item
                        label="Mật khẩu cũ"
                        name="oldPassword"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ!' }]}
                    >
                        <Input.Password prefix={<KeyOutlined />} placeholder='Nhập mật khẩu cũ' />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu mới"
                        name="newPassword"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                            { min: 6, message: 'Mật khẩu mới phải có ít nhất 6 ký tự trở lên!' }
                        ]}
                    >
                        <Input.Password prefix={<KeyOutlined />} placeholder='Nhập mật khẩu mới' />
                    </Form.Item>

                    <Form.Item
                        label="Xác nhận mật khẩu mới"
                        name="confirmPassword"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<KeyOutlined />} placeholder="Nhập lại mật khẩu mới" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                                style={{ backgroundColor: '#f4d03f', borderColor: '#f4d03f', color: '#000' }}
                            >
                                Cập nhật mật khẩu
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}