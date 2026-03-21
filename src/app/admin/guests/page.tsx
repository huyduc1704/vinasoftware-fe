'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Space, Tag, App, Typography, Card, Switch } from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    SearchOutlined,
    EditOutlined,
    TeamOutlined
} from '@ant-design/icons';
import { usersApi } from '@/utils/api';

const { Title, Text } = Typography;

export default function GuestAccountsPage() {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [searchText, setSearchText] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await usersApi.getGuests();
            setData(res);
        } catch (error: any) {
            message.error('Lỗi tải dữ liệu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 70,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Tài khoản',
            dataIndex: 'username',
            key: 'username',
            render: (text: string) => <Text strong color="blue">{text}</Text>,
        },
        {
            title: 'Họ tên',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Kích hoạt',
            dataIndex: 'isActive',
            key: 'isActive',
            align: 'center' as const,
            render: (active: boolean) => <Switch checked={active} />,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            align: 'center' as const,
            render: () => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} />
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Space>
            ),
        },
    ];

    const filteredData = data.filter((item: any) => {
        const search = searchText.toLowerCase();
        return (
            item.username?.toLowerCase().includes(search) ||
            item.name?.toLowerCase().includes(search) ||
            item.email?.toLowerCase().includes(search)
        );
    });

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={3} style={{ margin: 0 }}>Quản lý tài khoản khách</Title>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} style={{ backgroundColor: '#1890ff' }}>
                        Thêm mới
                    </Button>
                    <Button danger icon={<DeleteOutlined />}>
                        Xóa tất cả
                    </Button>
                </Space>
            </div>

            <Card style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '16px' }}>
                    <Input
                        placeholder="Tìm kiếm tài khoản, họ tên, email..."
                        prefix={<SearchOutlined />}
                        style={{ width: 300 }}
                        allowClear
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    bordered
                    size="middle"
                />
            </Card>
        </div>
    );
}