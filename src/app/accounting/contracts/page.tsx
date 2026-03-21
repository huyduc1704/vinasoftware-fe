'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, Space, message, Popconfirm, ConfigProvider, Badge, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import { contractApi } from '@/utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function ContractListPage() {
    const { message } = App.useApp();
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
            render: (val: any) => {
                if (!val) return '-';
                return new Intl.NumberFormat('vi-VN').format(Number(val)) + ' ₫';
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 50,
            align: 'center',
            filters: [
                { text: 'Đang thực hiện', value: 'ACTIVE' },
                { text: 'Chờ xử lý', value: 'PENDING' },
                { text: 'Đã hoàn thành', value: 'COMPLETED' }
            ],
            onFilter: (value: any, record: any) => record.status === value,
            render: (status: string) => {
                const getColor = () => {
                    if (status === 'COMPLETED') return 'green';
                    if (status === 'PENDING') return 'gold';
                    if (status === 'ACTIVE') return 'blue';
                    return 'default';
                };

                return (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Badge
                            color={getColor()}
                            style={{
                                transform: 'scale(1.4)',
                            }}
                        />
                    </div>
                );
            }
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

            <div style={{ marginBottom: 16 }}>
                <Space size="large" wrap>
                    <Text strong>Trạng thái hợp đồng:</Text>
                    <Badge color="blue" text="Đang thực hiện" />
                    <Badge color="gold" text="Chờ xử lý" />
                    <Badge color="green" text="Đã hoàn thành" />
                </Space>
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
                    dataSource={contracts.map((item: any, index: number) => ({ ...item, stt: index + 1 }))}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={{ pageSize: 15 }}
                />
            </ConfigProvider>
        </div>
    );
}
