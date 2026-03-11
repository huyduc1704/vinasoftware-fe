'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, Space, message, Popconfirm, ConfigProvider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import { contractApi } from '@/utils/api';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function ContractListPage() {
    const router = useRouter();
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchContracts = async () => {
        try {
            setLoading(true);
            const data = await contractApi.getContracts();
            if (Array.isArray(data)) {
                setContracts(data);
            } else if (data && Array.isArray(data.data)) {
                setContracts(data.data);
            } else if (data && Array.isArray(data.items)) {
                setContracts(data.items);
            } else {
                setContracts([]);
            }
        } catch (error: any) {
            message.error(error.message || 'Lỗi tải danh sách hợp đồng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await contractApi.deleteContract(id);
            message.success('Xóa hợp đồng thành công');
            fetchContracts();
        } catch (error: any) {
            message.error(error.message || 'Lỗi khi xóa hợp đồng');
        }
    };

    const columns: ColumnsType<any> = [
        {
            title: 'STT',
            dataIndex: 'stt',
            key: 'stt',
            width: 60,
            render: (text: any, record: any, index: number) => index + 1,
        },
        {
            title: 'Mã hợp đồng',
            dataIndex: 'contractCode',
            key: 'contractCode',
            width: 150,
        },
        {
            title: 'Tên hợp đồng',
            dataIndex: 'title',
            key: 'title',
            width: 250,
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            width: 100,
        },
        {
            title: 'Ngày nộp',
            dataIndex: 'submissionDate',
            key: 'submissionDate',
            width: 150,
            render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Tổng giá trị',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 150,
            render: (val: number) => val ? val.toLocaleString() + ' ₫' : '-',
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#1890ff' }} />}
                        onClick={() => router.push(`/accounting/contracts/${record.id}`)}
                    />
                    <Popconfirm
                        title="Xóa hợp đồng"
                        description="Bạn có chắc chắn muốn xóa hợp đồng này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', minHeight: 'calc(100vh - 150px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={4} style={{ margin: 0 }}>
                    Danh sách kế toán (Hợp đồng)
                </Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => router.push('/accounting/contracts/create')}
                    style={{ background: '#d32f2f', borderColor: '#d32f2f' }}
                >
                    Thêm kế toán mới
                </Button>
            </div>

            <ConfigProvider
                theme={{
                    components: {
                        Table: {
                            headerBg: '#f3db55',
                            headerColor: '#000000',
                            headerBorderRadius: 8,
                        },
                    },
                }}
            >
                <Table
                    columns={columns}
                    dataSource={contracts}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={{ pageSize: 15 }}
                />
            </ConfigProvider>
        </div>
    );
}
